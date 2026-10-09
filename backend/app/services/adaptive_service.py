"""
Orchestration between the AI agent and the existing simulation/training engines.

Flow:  history (database)  ->  agent proposal (ai/)  ->  backend validation
       ->  execution through the existing Simulation / Event / Training models.

The agent never writes to the database. This module validates the proposal and
executes it only after explicit administrator confirmation, and records an
audit event so every executed decision can be traced.

No schema changes: the audit trail is an Event (event_type="agent_decision")
attached to the simulation the decision created.
"""

import json
from dataclasses import asdict
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ai.agent import AgentDecision, decide_next_action
from ai.model_config import SCENARIOS
from ai.prediction_service import ClickPredictor
from backend.app.services import behavior_service
from backend.app.services.training_catalog import (
    DIFFICULTY_TO_TRAINING_LEVEL,
    TRAINING_CATALOG,
)
from backend.app.templates.phishing_templates import PHISHING_TEMPLATES
from database import models

COOLDOWN_HOURS = 24
AUDIT_EVENT_TYPE = "agent_decision"


class CooldownActiveError(RuntimeError):
    def __init__(self, existing_simulation_id: int):
        super().__init__(
            "an adaptive simulation was already created for this employee recently"
        )
        self.existing_simulation_id = existing_simulation_id


class StaleDecisionError(RuntimeError):
    """The server's current decision differs from what the approver saw."""


def build_decision(
    db: Session,
    employee_id: int,
    candidate_scenarios: list[str] | None,
    include_synthetic: bool,
    predictor: ClickPredictor | None,
) -> AgentDecision:
    behavior_service.get_active_employee(db, employee_id)
    history = behavior_service.get_history(db, employee_id, include_synthetic)
    completed, open_topics = behavior_service.get_training_topics(db, employee_id)

    return decide_next_action(
        history=history,
        candidate_scenarios=candidate_scenarios or list(SCENARIOS),
        predictor=predictor,
        completed_training_topics=completed,
        open_training_topics=open_topics,
    )


def create_training_for_decision(db: Session, employee_id: int, decision: AgentDecision) -> int | None:
    recommendation = decision.training_recommendation
    if recommendation is None or recommendation.already_assigned:
        return None

    content = TRAINING_CATALOG[recommendation.topic]
    training = models.Training(
        employee_id=employee_id,
        simulation_id=None,
        title=content["title"],
        content=content["content"],
        category=recommendation.topic,
        difficulty=DIFFICULTY_TO_TRAINING_LEVEL[decision.proposed_simulation.difficulty],
    )
    db.add(training)
    db.flush()

    for question, options, answer, explanation in content["questions"]:
        db.add(
            models.TrainingQuestion(
                training_id=training.id,
                question=question,
                options=options,
                correct_answer=answer,
                explanation=explanation,
            )
        )
    return training.id



def audit_payload(
    decision: AgentDecision, approved_by: str, include_synthetic: bool, training_id: int | None
) -> dict:
    """What is stored in the audit Event for an executed decision."""
    recommendation = decision.training_recommendation
    return {
        "approved_by": approved_by,
        "mode": decision.mode,
        "confidence": decision.confidence,
        "scenario": decision.proposed_simulation.scenario,
        "difficulty": decision.proposed_simulation.difficulty,
        "training_topic": recommendation.topic if recommendation else None,
        "training_id": training_id,
        "model_used": decision.model_used,
        "model_version": decision.model_version,
        "data_source": "includes_synthetic" if include_synthetic else "real_only",
        "guardrails_applied": decision.guardrails_applied,
        "rationale": decision.rationale,
        "employee_summary": asdict(decision.employee_summary),
    }


def execute_decision(
    db: Session,
    employee_id: int,
    decision: AgentDecision,
    approved_by: str,
    include_synthetic: bool,
    now: datetime | None = None,
    cooldown_hours: int = COOLDOWN_HOURS,
) -> dict:
    """Validate and execute an already-confirmed decision."""
    now = now or datetime.utcnow()
    proposal = decision.proposed_simulation

    # Backend validation: approved scenario with an existing email template.
    if proposal.scenario not in SCENARIOS or proposal.scenario not in PHISHING_TEMPLATES:
        raise ValueError(f"scenario not approved: {proposal.scenario!r}")

    campaign = behavior_service.get_or_create_adaptive_campaign(db)

    # Duplicate guard: one adaptive simulation per employee per cooldown window.
    recent = (
        db.query(models.Simulation)
        .filter(
            models.Simulation.employee_id == employee_id,
            models.Simulation.campaign_id == campaign.id,
            models.Simulation.created_at >= now - timedelta(hours=cooldown_hours),
        )
        .order_by(models.Simulation.created_at.desc())
        .first()
    )
    if recent is not None:
        db.rollback()
        raise CooldownActiveError(recent.id)

    simulation = models.Simulation(
        employee_id=employee_id,
        campaign_id=campaign.id,
        email_subject=PHISHING_TEMPLATES[proposal.scenario]["subject"],
        phishing_type=proposal.scenario,
        status="sent",
        created_at=now,
    )
    db.add(simulation)
    db.flush()

    training_id = create_training_for_decision(db, employee_id, decision)

    audit = audit_payload(decision, approved_by, include_synthetic, training_id)
    db.add(
        models.Event(
            simulation_id=simulation.id,
            event_type=AUDIT_EVENT_TYPE,
            description=json.dumps(audit),
        )
    )
    db.commit()
    db.refresh(simulation)

    return {
        "simulation_id": simulation.id,
        "scenario": simulation.phishing_type,
        "difficulty": proposal.difficulty,
        "email_subject": simulation.email_subject,
        "preview_path": f"/simulations/{simulation.id}/preview",
        "training_id": training_id,
        "campaign_id": campaign.id,
    }


def get_audit_trail(db: Session, employee_id: int, limit: int = 50) -> list[dict]:
    events = (
        db.query(models.Event)
        .join(models.Simulation, models.Event.simulation_id == models.Simulation.id)
        .filter(
            models.Simulation.employee_id == employee_id,
            models.Event.event_type == AUDIT_EVENT_TYPE,
        )
        .order_by(models.Event.created_at.desc(), models.Event.id.desc())
        .limit(limit)
        .all()
    )
    trail = []
    for event in events:
        try:
            details = json.loads(event.description or "{}")
        except json.JSONDecodeError:
            details = {}
        trail.append(
            {
                "event_id": event.id,
                "simulation_id": event.simulation_id,
                "created_at": event.created_at,
                "decision": details,
            }
        )
    return trail


def record_report(db: Session, simulation_id: int) -> dict | None:
    """Mark a simulation as reported by the employee (idempotent). None if unknown."""
    simulation = (
        db.query(models.Simulation).filter(models.Simulation.id == simulation_id).first()
    )
    if simulation is None:
        return None

    created_event = False
    if not simulation.reported:
        simulation.reported = True
        if not simulation.clicked:
            simulation.status = "reported"
        db.add(
            models.Event(
                simulation_id=simulation.id,
                event_type="report",
                description="Employee reported the simulated phishing email",
            )
        )
        created_event = True
        db.commit()
        db.refresh(simulation)

    return {
        "simulation_id": simulation.id,
        "reported": simulation.reported,
        "clicked": simulation.clicked,
        "status": simulation.status,
        "event_created": created_event,
    }
