"""
Admin portal API. Every route except /admin/login requires an admin token.

Dashboards return plain JSON built by backend.app.services.admin_service;
login and campaign execution use typed schemas (schemas_admin.py).
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ai.agent import AgentValidationError
from ai.model_config import SCENARIOS
from ai.prediction_service import ClickPredictor, get_predictor
from ai.vulnerability import analyze_scenarios
from backend.app import admin_auth
from backend.app.schemas_adaptive import decision_response
from backend.app.schemas_admin import (
    AdminLoginRequest,
    AdminTokenResponse,
    CampaignRunRequest,
    CampaignRunResponse,
)
from backend.app.services import (
    adaptive_service,
    admin_service,
    behavior_service,
    campaign_service,
)
from database.connection import get_db

router = APIRouter(prefix="/admin", tags=["admin"])
protected = APIRouter(tags=["admin"], dependencies=[Depends(admin_auth.require_admin)])


def _model_info(predictor: ClickPredictor) -> dict:
    if not predictor.is_available():
        return {"available": False}
    metadata = predictor.metadata
    return {
        "available": True,
        "model_version": metadata.get("model_version"),
        "status": metadata.get("status"),
        "data_source": metadata.get("data_source"),
    }


# ------------------------------------------------------------------ auth
@router.post("/login", response_model=AdminTokenResponse)
def admin_login(body: AdminLoginRequest, request: Request):
    if not admin_auth.admin_configured():
        raise HTTPException(status_code=503, detail="Admin portal is not configured")

    client_key = request.client.host if request.client else "unknown"
    if admin_auth.login_throttle.is_blocked(client_key):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    if not admin_auth.authenticate_admin(body.email, body.password):
        admin_auth.login_throttle.record_failure(client_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    admin_auth.login_throttle.reset(client_key)
    email = body.email.strip().lower()
    token, expires_at = admin_auth.create_token(email)
    return AdminTokenResponse(access_token=token, expires_at=expires_at, email=email)


@protected.get("/me")
def admin_me(email: str = Depends(admin_auth.require_admin)):
    return {"email": email}


# ------------------------------------------------------------- dashboards
@protected.get("/overview")
def overview(
    include_synthetic: bool = False,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    return admin_service.overview(db, include_synthetic, _model_info(predictor))


@protected.get("/employees")
def employees(include_synthetic: bool = False, db: Session = Depends(get_db)):
    return {
        "data_source": admin_service.data_source(include_synthetic),
        "employees": admin_service.employee_rows(db, include_synthetic),
    }


@protected.get("/weakness-matrix")
def weakness_matrix(include_synthetic: bool = False, db: Session = Depends(get_db)):
    return admin_service.weakness_matrix(db, include_synthetic)


@protected.get("/employees/{employee_id}")
def employee_detail(
    employee_id: int,
    include_synthetic: bool = False,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    employee = db.query(behavior_service.models.Employee).filter_by(id=employee_id).first()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    history = behavior_service.get_history(db, employee_id, include_synthetic)
    analysis = analyze_scenarios(history, list(SCENARIOS), predictor)
    summary = analysis.summary

    proposal = None
    if employee.is_active:
        try:
            decision = adaptive_service.build_decision(
                db, employee_id, None, include_synthetic, predictor
            )
            proposal = decision_response(
                decision, employee_id, admin_service.data_source(include_synthetic)
            ).model_dump()
        except AgentValidationError:
            proposal = None

    row = next(
        (r for r in admin_service.employee_rows(db, include_synthetic) if r["employee_id"] == employee_id),
        None,
    )
    return {
        "data_source": admin_service.data_source(include_synthetic),
        "employee": {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "department": employee.department,
            "is_active": employee.is_active,
        },
        "risk_level": admin_service.risk_level(summary),
        "top_weakness": row["top_weakness"] if row else None,
        "summary": summary.__dict__,
        "assessments": [a.__dict__ for a in analysis.assessments],
        "model_used": analysis.model_used,
        "model_version": analysis.model_version,
        "warnings": analysis.warnings,
        "trainings": admin_service.employee_trainings(db, employee_id),
        "activity": admin_service.employee_activity(db, employee_id, include_synthetic),
        "agent_proposal": proposal,
        "agent_audit": adaptive_service.get_audit_trail(db, employee_id, 20),
        "disclaimer": "Estimates come from limited history; they are hints for review, "
        "not judgements about the employee.",
    }


# --------------------------------------------------------------- campaigns
@protected.get("/campaigns")
def campaigns(include_synthetic: bool = False, db: Session = Depends(get_db)):
    return {
        "data_source": admin_service.data_source(include_synthetic),
        "campaigns": admin_service.campaign_list(db, include_synthetic),
    }


@protected.get("/campaigns/{campaign_id}")
def campaign_detail(campaign_id: int, db: Session = Depends(get_db)):
    detail = admin_service.campaign_detail(db, campaign_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return detail


@protected.post("/campaigns/run", response_model=CampaignRunResponse)
def run_campaign(
    body: CampaignRunRequest,
    admin_email: str = Depends(admin_auth.require_admin),
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    """Preview (dry_run=true, default) or execute (dry_run=false and confirm=true) a campaign."""
    if not body.dry_run and not body.confirm:
        raise HTTPException(status_code=400, detail="confirm must be true to run a campaign")

    try:
        return campaign_service.run_campaign(
            db,
            name=body.name,
            description=body.description,
            employee_ids=body.employee_ids,
            mode=body.mode,
            scenario=body.scenario,
            assign_training=body.assign_training,
            include_synthetic=body.include_synthetic,
            admin_email=admin_email,
            predictor=predictor if body.use_model else None,
            dry_run=body.dry_run,
        )
    except campaign_service.CampaignNameTakenError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except (campaign_service.CampaignValidationError, AgentValidationError) as error:
        raise HTTPException(status_code=422, detail=str(error))


router.include_router(protected)
