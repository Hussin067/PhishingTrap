"""
Read-only dashboard queries for the admin portal.

Everything is computed from recorded simulations through the same statistics
the agent uses (ai.vulnerability). The synthetic training campaign is excluded
unless include_synthetic=True, and every response says which data it used.

Risk levels and weaknesses are statistical hints on limited data, not
judgements about people; the UI shows the evidence (attempts, clicks) next to
every claim.
"""

import json
from collections import defaultdict

from sqlalchemy.orm import Session

from ai.agent import is_supported_weakness
from ai.model_config import SCENARIOS
from ai.vulnerability import analyze_scenarios, summarize_employee
from backend.app.services import behavior_service
from database import models

# Documented, untuned thresholds on the smoothed overall click rate.
RISK_MEDIUM_FROM = 0.20
RISK_HIGH_FROM = 0.35


def data_source(include_synthetic: bool) -> str:
    return "includes_synthetic" if include_synthetic else "real_only"


def risk_level(summary) -> str:
    if summary.cold_start:
        return "insufficient_data"
    if summary.smoothed_click_rate >= RISK_HIGH_FROM:
        return "high"
    if summary.smoothed_click_rate >= RISK_MEDIUM_FROM:
        return "medium"
    return "low"


def load_all_histories(db: Session, include_synthetic: bool) -> dict[int, list]:
    """One query: employee_id -> simulations, oldest first."""
    query = db.query(models.Simulation).join(
        models.Campaign, models.Simulation.campaign_id == models.Campaign.id
    )
    if not include_synthetic:
        query = query.filter(models.Campaign.name != behavior_service.SYNTHETIC_CAMPAIGN_NAME)
    histories: dict[int, list] = defaultdict(list)
    for simulation in query.order_by(models.Simulation.created_at, models.Simulation.id):
        histories[simulation.employee_id].append(simulation)
    return histories


def active_employees(db: Session) -> list:
    return (
        db.query(models.Employee)
        .filter(models.Employee.is_active == True)  # noqa: E712
        .order_by(models.Employee.id)
        .all()
    )


def _training_counts(db: Session) -> dict[int, dict[str, int]]:
    counts: dict[int, dict[str, int]] = defaultdict(lambda: {"open": 0, "completed": 0})
    for training in db.query(models.Training).all():
        counts[training.employee_id]["completed" if training.completed else "open"] += 1
    return counts


def _weakness_fields(assessments) -> tuple[dict | None, str | None]:
    """(established weakness, scenario to watch). Established needs real evidence."""
    supported = sorted(
        (a for a in assessments if is_supported_weakness(a)), key=lambda a: -a.estimated_risk
    )
    established = None
    if supported:
        top = supported[0]
        established = {
            "scenario": top.scenario,
            "clicks": top.clicks,
            "attempts": top.attempts,
            "estimated_risk": top.estimated_risk,
        }
    watch = max(assessments, key=lambda a: a.estimated_risk).scenario if assessments else None
    return established, watch


def employee_rows(db: Session, include_synthetic: bool) -> list[dict]:
    histories = load_all_histories(db, include_synthetic)
    trainings = _training_counts(db)
    rows = []
    for employee in active_employees(db):
        history = histories.get(employee.id, [])
        analysis = analyze_scenarios(history, list(SCENARIOS), predictor=None)
        summary = analysis.summary
        established, watch = _weakness_fields(analysis.assessments)
        rows.append(
            {
                "employee_id": employee.id,
                "name": employee.name,
                "department": employee.department,
                "simulations": summary.total_simulations,
                "clicks": summary.total_clicks,
                "reports": summary.total_reports,
                "click_rate": summary.click_rate,
                "smoothed_click_rate": summary.smoothed_click_rate,
                "risk_level": risk_level(summary),
                "top_weakness": established,
                "scenario_to_watch": None if summary.cold_start else watch,
                "open_trainings": trainings[employee.id]["open"],
                "completed_trainings": trainings[employee.id]["completed"],
                "last_simulation_at": history[-1].created_at if history else None,
            }
        )
    return rows


def weakness_matrix(db: Session, include_synthetic: bool) -> dict:
    histories = load_all_histories(db, include_synthetic)
    employees = []
    for employee in active_employees(db):
        analysis = analyze_scenarios(histories.get(employee.id, []), list(SCENARIOS), None)
        employees.append(
            {
                "employee_id": employee.id,
                "name": employee.name,
                "cells": [
                    {
                        "scenario": a.scenario,
                        "attempts": a.attempts,
                        "clicks": a.clicks,
                        "estimated_risk": a.estimated_risk,
                        "evidence_level": a.evidence_level,
                        "established": is_supported_weakness(a),
                    }
                    for a in analysis.assessments
                ],
            }
        )
    return {
        "data_source": data_source(include_synthetic),
        "scenarios": list(SCENARIOS),
        "employees": employees,
        "note": "Risk is a smoothed click rate from limited history (statistics only; "
        "the ML model is not used here). Cells with few attempts are unreliable.",
    }


def overview(db: Session, include_synthetic: bool, model_info: dict) -> dict:
    histories = load_all_histories(db, include_synthetic)
    rows = employee_rows(db, include_synthetic)
    employees = {e.id: e for e in active_employees(db)}

    all_sims = [s for sims in histories.values() for s in sims if s.employee_id in employees]
    total = len(all_sims)
    clicks = sum(1 for s in all_sims if s.clicked)
    reports = sum(1 for s in all_sims if s.reported)

    per_scenario = []
    for scenario in SCENARIOS:
        same = [s for s in all_sims if s.phishing_type == scenario]
        n = len(same)
        c = sum(1 for s in same if s.clicked)
        per_scenario.append(
            {
                "scenario": scenario,
                "attempts": n,
                "clicks": c,
                "reports": sum(1 for s in same if s.reported),
                "click_rate": round(c / n, 4) if n else None,
            }
        )

    by_department: dict[str, list] = defaultdict(list)
    for sim in all_sims:
        by_department[employees[sim.employee_id].department or "Unassigned"].append(sim)
    department_stats = []
    for department, sims in sorted(by_department.items()):
        c = sum(1 for s in sims if s.clicked)
        department_stats.append(
            {
                "department": department,
                "employees": len({s.employee_id for s in sims}),
                "simulations": len(sims),
                "click_rate": round(c / len(sims), 4),
            }
        )

    distribution = {"low": 0, "medium": 0, "high": 0, "insufficient_data": 0}
    for row in rows:
        distribution[row["risk_level"]] += 1

    ranked = sorted(
        (r for r in rows if r["risk_level"] != "insufficient_data"),
        key=lambda r: -r["smoothed_click_rate"],
    )[:5]

    trainings = db.query(models.Training).all()
    completed = sum(1 for t in trainings if t.completed)

    campaigns = db.query(models.Campaign).all()
    campaign_count = sum(
        1
        for c in campaigns
        if include_synthetic or c.name != behavior_service.SYNTHETIC_CAMPAIGN_NAME
    )

    return {
        "data_source": data_source(include_synthetic),
        "employees_total": len(employees),
        "simulations_total": total,
        "clicks": clicks,
        "reports": reports,
        "click_rate": round(clicks / total, 4) if total else None,
        "report_rate": round(reports / total, 4) if total else None,
        "trainings_assigned": len(trainings),
        "trainings_completed": completed,
        "campaigns_total": campaign_count,
        "risk_distribution": distribution,
        "scenario_stats": per_scenario,
        "department_stats": department_stats,
        "top_at_risk": [
            {
                "employee_id": r["employee_id"],
                "name": r["name"],
                "smoothed_click_rate": r["smoothed_click_rate"],
                "top_weakness": r["top_weakness"],
            }
            for r in ranked
        ],
        "recent_activity": recent_activity(db, include_synthetic, limit=12),
        "model": model_info,
    }


def _parse(description: str | None) -> dict:
    try:
        value = json.loads(description or "{}")
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        return {}


def recent_activity(db: Session, include_synthetic: bool, limit: int = 12) -> list[dict]:
    query = (
        db.query(models.Event, models.Simulation, models.Employee)
        .join(models.Simulation, models.Event.simulation_id == models.Simulation.id)
        .join(models.Employee, models.Simulation.employee_id == models.Employee.id)
        .join(models.Campaign, models.Simulation.campaign_id == models.Campaign.id)
    )
    if not include_synthetic:
        query = query.filter(models.Campaign.name != behavior_service.SYNTHETIC_CAMPAIGN_NAME)
    rows = query.order_by(models.Event.created_at.desc(), models.Event.id.desc()).limit(limit).all()
    return [
        {
            "at": event.created_at,
            "employee_id": employee.id,
            "employee_name": employee.name,
            "type": event.event_type,
            "scenario": simulation.phishing_type,
            "simulation_id": simulation.id,
        }
        for event, simulation, employee in rows
    ]


def employee_activity(db: Session, employee_id: int, include_synthetic: bool, limit: int = 100):
    """Merged timeline of everything the employee did or was sent."""
    entries = []
    campaigns = {c.id: c.name for c in db.query(models.Campaign).all()}

    history = behavior_service.get_history(db, employee_id, include_synthetic)
    visible_ids = {s.id for s in history}
    for s in history:
        entries.append(
            {
                "at": s.created_at,
                "type": "simulation_sent",
                "scenario": s.phishing_type,
                "simulation_id": s.id,
                "detail": f"Campaign: {campaigns.get(s.campaign_id, '?')}",
            }
        )

    if visible_ids:
        events = db.query(models.Event).filter(models.Event.simulation_id.in_(visible_ids)).all()
        scenario_of = {s.id: s.phishing_type for s in history}
        for event in events:
            details = _parse(event.description)
            if event.event_type == "agent_decision":
                detail = f"Agent proposal approved by {details.get('approved_by', '?')}"
            elif event.event_type == "campaign_launch":
                detail = f"Campaign launched by {details.get('approved_by', '?')}"
            else:
                detail = event.description or ""
            entries.append(
                {
                    "at": event.created_at,
                    "type": event.event_type,
                    "scenario": scenario_of.get(event.simulation_id),
                    "simulation_id": event.simulation_id,
                    "detail": detail,
                }
            )

    for t in db.query(models.Training).filter(models.Training.employee_id == employee_id).all():
        entries.append(
            {
                "at": t.created_at,
                "type": "training_assigned",
                "scenario": t.category,
                "simulation_id": t.simulation_id,
                "detail": t.title,
            }
        )
        if t.completed and t.completed_at:
            entries.append(
                {
                    "at": t.completed_at,
                    "type": "training_completed",
                    "scenario": t.category,
                    "simulation_id": t.simulation_id,
                    "detail": f"{t.title} - score {t.score}%",
                }
            )

    entries.sort(key=lambda e: e["at"], reverse=True)
    return entries[:limit]


def employee_trainings(db: Session, employee_id: int) -> list[dict]:
    return [
        {
            "id": t.id,
            "title": t.title,
            "category": t.category,
            "difficulty": t.difficulty,
            "completed": t.completed,
            "score": t.score,
            "created_at": t.created_at,
            "completed_at": t.completed_at,
        }
        for t in db.query(models.Training)
        .filter(models.Training.employee_id == employee_id)
        .order_by(models.Training.created_at.desc())
        .all()
    ]


def campaign_list(db: Session, include_synthetic: bool) -> list[dict]:
    result = []
    for campaign in db.query(models.Campaign).order_by(models.Campaign.id.desc()).all():
        is_synthetic = campaign.name == behavior_service.SYNTHETIC_CAMPAIGN_NAME
        if is_synthetic and not include_synthetic:
            continue
        sims = db.query(models.Simulation).filter(models.Simulation.campaign_id == campaign.id).all()
        n = len(sims)
        clicks = sum(1 for s in sims if s.clicked)
        reports = sum(1 for s in sims if s.reported)
        result.append(
            {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "created_at": campaign.created_at,
                "is_synthetic": is_synthetic,
                "employees": len({s.employee_id for s in sims}),
                "simulations": n,
                "clicks": clicks,
                "reports": reports,
                "click_rate": round(clicks / n, 4) if n else None,
                "report_rate": round(reports / n, 4) if n else None,
            }
        )
    return result


def campaign_detail(db: Session, campaign_id: int, limit: int = 300) -> dict | None:
    campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    if campaign is None:
        return None
    rows = (
        db.query(models.Simulation, models.Employee)
        .join(models.Employee, models.Simulation.employee_id == models.Employee.id)
        .filter(models.Simulation.campaign_id == campaign_id)
        .order_by(models.Simulation.created_at.desc(), models.Simulation.id.desc())
        .all()
    )
    sims = [s for s, _ in rows]
    n = len(sims)
    clicks = sum(1 for s in sims if s.clicked)
    reports = sum(1 for s in sims if s.reported)
    by_scenario: dict[str, int] = defaultdict(int)
    for s in sims:
        by_scenario[s.phishing_type] += 1
    return {
        "id": campaign.id,
        "name": campaign.name,
        "description": campaign.description,
        "created_at": campaign.created_at,
        "is_synthetic": campaign.name == behavior_service.SYNTHETIC_CAMPAIGN_NAME,
        "simulations": n,
        "clicks": clicks,
        "reports": reports,
        "ignored": n - clicks - reports + sum(1 for s in sims if s.clicked and s.reported),
        "click_rate": round(clicks / n, 4) if n else None,
        "report_rate": round(reports / n, 4) if n else None,
        "scenarios": dict(by_scenario),
        "results_shown": min(n, limit),
        "results": [
            {
                "simulation_id": s.id,
                "employee_id": e.id,
                "employee_name": e.name,
                "department": e.department,
                "scenario": s.phishing_type,
                "status": s.status,
                "clicked": s.clicked,
                "reported": s.reported,
                "sent_at": s.created_at,
                "preview_path": f"/simulations/{s.id}/preview",
            }
            for s, e in rows[:limit]
        ],
    }
