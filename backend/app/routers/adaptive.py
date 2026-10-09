"""
Adaptive AI endpoints: behaviour analysis, click prediction, agent decisions.

Database access goes through backend.app.services; the ML model and agent live
in the ai/ package. Existing endpoints are untouched.

NOTE: like the rest of the current API, these endpoints have no authentication.
Agent execution should be restricted to administrators before real use.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ai.agent import AgentValidationError, validate_candidates
from ai.features import build_feature_row
from ai.model_config import SCENARIOS
from ai.prediction_service import (
    ClickPredictor,
    InvalidFeaturesError,
    ModelUnavailableError,
    get_predictor,
)
from ai.vulnerability import analyze_scenarios
from backend.app.schemas_adaptive import (
    AgentDecisionResponse,
    AuditEntry,
    ClickProbabilityResponse,
    DecisionRequest,
    ExecuteRequest,
    ExecuteResponse,
    ModelStatusResponse,
    ReportResponse,
    ScenarioAnalysisResponse,
)
from backend.app.services import adaptive_service, behavior_service
from database.connection import get_db

router = APIRouter(tags=["adaptive-ai"])

DISCLAIMER = (
    "Estimates come from limited history and an experimental model trained on "
    "synthetic data. They are hints for review, not measured real-world risk."
)


def _data_source(include_synthetic: bool) -> str:
    return "includes_synthetic" if include_synthetic else "real_only"


def _employee_or_http_error(db: Session, employee_id: int):
    try:
        return behavior_service.get_active_employee(db, employee_id)
    except behavior_service.EmployeeNotFoundError:
        raise HTTPException(status_code=404, detail="Employee not found")
    except behavior_service.EmployeeInactiveError:
        raise HTTPException(status_code=409, detail="Employee account is inactive")


def _optional_predictor(use_model: bool, predictor: ClickPredictor):
    return predictor if use_model else None


@router.get("/ai/model-status", response_model=ModelStatusResponse)
def model_status(predictor: ClickPredictor = Depends(get_predictor)):
    if not predictor.is_available():
        return ModelStatusResponse(available=False, note="Model not available; agent uses statistics only.")
    metadata = predictor.metadata
    return ModelStatusResponse(
        available=True,
        model_version=metadata.get("model_version"),
        status=metadata.get("status"),
        trained_at=metadata.get("trained_at"),
        data_source=metadata.get("data_source"),
        note=metadata.get("note"),
    )


@router.get("/employees/{employee_id}/scenario-analysis", response_model=ScenarioAnalysisResponse)
def scenario_analysis(
    employee_id: int,
    scenarios: str | None = Query(default=None, description="Comma-separated scenarios"),
    include_synthetic: bool = False,
    use_model: bool = True,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    _employee_or_http_error(db, employee_id)

    requested = [s.strip() for s in scenarios.split(",") if s.strip()] if scenarios else list(SCENARIOS)
    try:
        candidates = validate_candidates(requested)
    except AgentValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))

    history = behavior_service.get_history(db, employee_id, include_synthetic)
    analysis = analyze_scenarios(history, candidates, _optional_predictor(use_model, predictor))

    return ScenarioAnalysisResponse(
        employee_id=employee_id,
        data_source=_data_source(include_synthetic),
        model_used=analysis.model_used,
        model_version=analysis.model_version,
        warnings=analysis.warnings,
        disclaimer=DISCLAIMER,
        summary=analysis.summary,
        assessments=analysis.assessments,
    )


@router.get(
    "/employees/{employee_id}/scenarios/{scenario}/click-probability",
    response_model=ClickProbabilityResponse,
)
def click_probability(
    employee_id: int,
    scenario: str,
    include_synthetic: bool = False,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=422, detail=f"Unapproved scenario: {scenario!r}")
    _employee_or_http_error(db, employee_id)

    history = behavior_service.get_history(db, employee_id, include_synthetic)
    features = build_feature_row(history, scenario)

    try:
        result = predictor.predict_click_probability(features)
    except ModelUnavailableError as error:
        raise HTTPException(status_code=503, detail=f"Prediction model unavailable: {error}")
    except InvalidFeaturesError as error:
        raise HTTPException(status_code=422, detail=str(error))

    return ClickProbabilityResponse(
        employee_id=employee_id,
        scenario=scenario,
        data_source=_data_source(include_synthetic),
        scenario_attempts=features["scenario_attempts"],
        click_probability=result.click_probability,
        model_version=result.model_version,
        model_status=result.model_status,
        disclaimer=DISCLAIMER,
    )


@router.post("/employees/{employee_id}/agent/decision", response_model=AgentDecisionResponse)
def agent_decision(
    employee_id: int,
    request: DecisionRequest | None = None,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    """Propose the next simulation and training. No side effects."""
    request = request or DecisionRequest()
    try:
        decision = adaptive_service.build_decision(
            db,
            employee_id,
            request.candidate_scenarios,
            request.include_synthetic,
            _optional_predictor(request.use_model, predictor),
        )
    except behavior_service.EmployeeNotFoundError:
        raise HTTPException(status_code=404, detail="Employee not found")
    except behavior_service.EmployeeInactiveError:
        raise HTTPException(status_code=409, detail="Employee account is inactive")
    except AgentValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))

    response = AgentDecisionResponse.model_validate(
        {
            **{name: getattr(decision, name) for name in AgentDecisionResponse.model_fields if hasattr(decision, name)},
            "employee_id": employee_id,
            "data_source": _data_source(request.include_synthetic),
        }
    )
    return response


@router.post("/employees/{employee_id}/agent/execute", response_model=ExecuteResponse)
def agent_execute(
    employee_id: int,
    request: ExecuteRequest,
    db: Session = Depends(get_db),
    predictor: ClickPredictor = Depends(get_predictor),
):
    """
    Re-run the agent on the server, then execute its proposal after explicit
    confirmation. The client cannot supply the scenario: it can only approve
    (and optionally pin) what the agent currently proposes.
    """
    if not request.confirm:
        raise HTTPException(status_code=400, detail="confirm must be true to execute a decision")

    try:
        decision = adaptive_service.build_decision(
            db,
            employee_id,
            request.candidate_scenarios,
            request.include_synthetic,
            _optional_predictor(request.use_model, predictor),
        )
        if (
            request.expected_scenario is not None
            and request.expected_scenario != decision.proposed_simulation.scenario
        ):
            raise adaptive_service.StaleDecisionError(
                f"proposal changed: now '{decision.proposed_simulation.scenario}'"
            )
        result = adaptive_service.execute_decision(
            db,
            employee_id,
            decision,
            approved_by=request.approved_by,
            include_synthetic=request.include_synthetic,
        )
    except behavior_service.EmployeeNotFoundError:
        raise HTTPException(status_code=404, detail="Employee not found")
    except behavior_service.EmployeeInactiveError:
        raise HTTPException(status_code=409, detail="Employee account is inactive")
    except AgentValidationError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except adaptive_service.StaleDecisionError as error:
        raise HTTPException(status_code=409, detail=str(error))
    except adaptive_service.CooldownActiveError as error:
        raise HTTPException(
            status_code=409,
            detail=f"{error} (simulation {error.existing_simulation_id})",
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    return ExecuteResponse(**result)


@router.get("/employees/{employee_id}/agent/audit", response_model=list[AuditEntry])
def agent_audit(
    employee_id: int,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    try:
        behavior_service.get_active_employee(db, employee_id)
    except behavior_service.EmployeeNotFoundError:
        raise HTTPException(status_code=404, detail="Employee not found")
    except behavior_service.EmployeeInactiveError:
        pass  # audit of an inactive employee is still readable
    return adaptive_service.get_audit_trail(db, employee_id, limit)


@router.post("/simulations/{simulation_id}/report", response_model=ReportResponse)
def report_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """Record that the employee reported the simulated phishing email."""
    result = adaptive_service.record_report(db, simulation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return result
