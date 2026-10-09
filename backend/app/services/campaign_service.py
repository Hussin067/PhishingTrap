"""
Admin-run campaigns.

A campaign is created by an authenticated admin and records one simulation per
targeted employee, using the existing Campaign / Simulation / Event tables and
the existing email templates. Two modes:

  fixed     every employee gets the scenario the admin chose
  adaptive  the agent proposes a scenario (and difficulty / training) per employee

Safeguards: dry-run preview, approved scenarios only, no duplicate campaign
names, skip employees who got a simulation recently, recipient cap, inactive
employees skipped, and an audit Event naming the approving admin.

No email is delivered by this prototype: each simulation is a database record
with a preview link. Wire a mail sender to an INTERNAL test inbox before use.
"""

import json
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from ai.model_config import SCENARIOS
from ai.prediction_service import ClickPredictor
from backend.app.services import adaptive_service, admin_service, behavior_service
from backend.app.templates.phishing_templates import PHISHING_TEMPLATES
from database import models

MAX_RECIPIENTS = 500
DEFAULT_SKIP_RECENT_HOURS = 24
RESERVED_NAMES = {
    behavior_service.SYNTHETIC_CAMPAIGN_NAME.lower(),
    behavior_service.ADAPTIVE_CAMPAIGN_NAME.lower(),
}


class CampaignValidationError(ValueError):
    pass


class CampaignNameTakenError(RuntimeError):
    pass


def _validate(name: str, mode: str, scenario: str | None) -> str:
    name = (name or "").strip()
    if not 1 <= len(name) <= 150:
        raise CampaignValidationError("Campaign name must be 1-150 characters.")
    if name.lower() in RESERVED_NAMES:
        raise CampaignValidationError("That campaign name is reserved.")
    if mode not in ("fixed", "adaptive"):
        raise CampaignValidationError("mode must be 'fixed' or 'adaptive'.")
    if mode == "fixed":
        if scenario not in SCENARIOS or scenario not in PHISHING_TEMPLATES:
            raise CampaignValidationError("A valid approved scenario is required for a fixed campaign.")
    return name


def run_campaign(
    db: Session,
    *,
    name: str,
    description: str | None,
    employee_ids: list[int] | None,
    mode: str,
    scenario: str | None,
    assign_training: bool,
    include_synthetic: bool,
    admin_email: str,
    predictor: ClickPredictor | None,
    dry_run: bool,
    skip_recent_hours: int = DEFAULT_SKIP_RECENT_HOURS,
    now: datetime | None = None,
) -> dict:
    now = now or datetime.utcnow()
    name = _validate(name, mode, scenario)

    taken = (
        db.query(models.Campaign)
        .filter(func.lower(models.Campaign.name) == name.lower())
        .first()
    )
    if taken is not None:
        raise CampaignNameTakenError(f"A campaign named '{name}' already exists.")

    # ---- Who is targeted? ----
    skipped: list[dict] = []
    if employee_ids is None:
        targets = admin_service.active_employees(db)
    else:
        unique_ids = list(dict.fromkeys(employee_ids))
        found = {
            e.id: e
            for e in db.query(models.Employee).filter(models.Employee.id.in_(unique_ids)).all()
        }
        targets = []
        for employee_id in unique_ids:
            employee = found.get(employee_id)
            if employee is None:
                skipped.append({"employee_id": employee_id, "reason": "not_found"})
            elif not employee.is_active:
                skipped.append({"employee_id": employee_id, "reason": "inactive"})
            else:
                targets.append(employee)

    if not targets:
        raise CampaignValidationError("No eligible employees were selected.")
    if len(targets) > MAX_RECIPIENTS:
        raise CampaignValidationError(f"At most {MAX_RECIPIENTS} employees per campaign.")

    # ---- Skip employees who were simulated very recently ----
    cutoff = now - timedelta(hours=skip_recent_hours)
    recent_ids = {
        row[0]
        for row in db.query(models.Simulation.employee_id)
        .join(models.Campaign, models.Simulation.campaign_id == models.Campaign.id)
        .filter(
            models.Simulation.employee_id.in_([e.id for e in targets]),
            models.Simulation.created_at >= cutoff,
            models.Campaign.name != behavior_service.SYNTHETIC_CAMPAIGN_NAME,
        )
        .distinct()
        .all()
    }

    plan = []
    for employee in targets:
        if employee.id in recent_ids:
            skipped.append({"employee_id": employee.id, "reason": "recent_simulation"})
            continue

        if mode == "fixed":
            plan.append(
                {"employee": employee, "scenario": scenario, "difficulty": None, "decision": None}
            )
        else:
            decision = adaptive_service.build_decision(
                db, employee.id, None, include_synthetic, predictor
            )
            plan.append(
                {
                    "employee": employee,
                    "scenario": decision.proposed_simulation.scenario,
                    "difficulty": decision.proposed_simulation.difficulty,
                    "decision": decision,
                }
            )

    if not plan:
        raise CampaignValidationError(
            "Every selected employee was skipped (recent simulation, inactive or unknown)."
        )

    def planned_row(item, simulation_id=None, training_id=None):
        recommendation = item["decision"].training_recommendation if item["decision"] else None
        return {
            "employee_id": item["employee"].id,
            "employee_name": item["employee"].name,
            "scenario": item["scenario"],
            "difficulty": item["difficulty"],
            "training_topic": recommendation.topic if recommendation else None,
            "simulation_id": simulation_id,
            "training_id": training_id,
            "preview_path": f"/simulations/{simulation_id}/preview" if simulation_id else None,
        }

    base = {
        "name": name,
        "mode": mode,
        "data_source": admin_service.data_source(include_synthetic),
        "delivery": "not_configured",
        "skipped": skipped,
    }

    if dry_run:
        return {
            **base,
            "dry_run": True,
            "campaign_id": None,
            "planned": [planned_row(item) for item in plan],
        }

    # ---- Execute in one transaction ----
    try:
        campaign = models.Campaign(
            name=name,
            description=(description or "").strip() or f"Admin-run {mode} campaign",
        )
        db.add(campaign)
        db.flush()

        created = []
        for item in plan:
            employee = item["employee"]
            simulation = models.Simulation(
                employee_id=employee.id,
                campaign_id=campaign.id,
                email_subject=PHISHING_TEMPLATES[item["scenario"]]["subject"],
                phishing_type=item["scenario"],
                status="sent",
                created_at=now,
            )
            db.add(simulation)
            db.flush()

            training_id = None
            decision = item["decision"]
            if decision is not None:
                if assign_training:
                    training_id = adaptive_service.create_training_for_decision(
                        db, employee.id, decision
                    )
                audit = adaptive_service.audit_payload(
                    decision, admin_email, include_synthetic, training_id
                )
                audit["source"] = "admin_campaign"
                event_type = adaptive_service.AUDIT_EVENT_TYPE
            else:
                audit = {
                    "approved_by": admin_email,
                    "mode": "fixed",
                    "scenario": item["scenario"],
                    "source": "admin_campaign",
                }
                event_type = "campaign_launch"

            db.add(
                models.Event(
                    simulation_id=simulation.id,
                    event_type=event_type,
                    description=json.dumps(audit),
                )
            )
            created.append(planned_row(item, simulation.id, training_id))

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {**base, "dry_run": False, "campaign_id": campaign.id, "planned": created}
