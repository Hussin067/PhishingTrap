"""Request/response schemas for the adaptive AI endpoints.

Responses contain employee ids only: no names, emails or password hashes.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ai.model_config import SCENARIOS


def _check_scenarios(values: list[str] | None) -> list[str] | None:
    if values is None:
        return None
    unknown = [value for value in values if value not in SCENARIOS]
    if unknown:
        raise ValueError(f"unapproved scenario(s): {unknown}")
    return values


class DecisionRequest(BaseModel):
    candidate_scenarios: list[str] | None = Field(
        default=None, description="Subset of approved scenarios; default is all 12."
    )
    include_synthetic: bool = Field(
        default=False, description="Include synthetic training data (demo only)."
    )
    use_model: bool = True

    _validate = field_validator("candidate_scenarios")(_check_scenarios)


class ExecuteRequest(DecisionRequest):
    confirm: bool = Field(default=False, description="Must be true to execute.")
    approved_by: str = Field(min_length=1, max_length=100)
    expected_scenario: str | None = Field(
        default=None,
        description="Scenario the approver saw; execution is refused if the "
        "agent's current proposal differs.",
    )


class _Out(BaseModel):
    # protected_namespaces=(): fields such as model_version are intentional.
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class EmployeeSummaryOut(_Out):
    total_simulations: int
    total_clicks: int
    total_reports: int
    click_rate: float | None
    report_rate: float | None
    smoothed_click_rate: float
    recent_failures: int
    cold_start: bool


class ScenarioAssessmentOut(_Out):
    scenario: str
    attempts: int
    clicks: int
    reports: int
    observed_click_rate: float | None
    smoothed_click_rate: float
    interval_low: float
    interval_high: float
    ml_click_probability: float | None
    estimated_risk: float
    evidence_level: str
    notes: list[str]


class ScenarioAnalysisResponse(_Out):
    employee_id: int
    data_source: str
    model_used: bool
    model_version: str | None
    warnings: list[str]
    disclaimer: str
    summary: EmployeeSummaryOut
    assessments: list[ScenarioAssessmentOut]


class ClickProbabilityResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    employee_id: int
    scenario: str
    data_source: str
    scenario_attempts: int
    click_probability: float
    model_version: str
    model_status: str
    disclaimer: str


class SimulationProposalOut(_Out):
    scenario: str
    difficulty: str


class TrainingRecommendationOut(_Out):
    topic: str
    priority: str
    reason: str
    already_assigned: bool


class AgentDecisionResponse(_Out):
    employee_id: int
    data_source: str
    mode: str
    confidence: str
    proposed_simulation: SimulationProposalOut
    training_recommendation: TrainingRecommendationOut | None
    rationale: list[str]
    limitations: list[str]
    guardrails_applied: list[str]
    employee_summary: EmployeeSummaryOut
    assessments: list[ScenarioAssessmentOut]
    model_used: bool
    model_version: str | None
    warnings: list[str]
    executed: bool = False


class ExecuteResponse(BaseModel):
    simulation_id: int
    scenario: str
    difficulty: str
    email_subject: str
    preview_path: str
    training_id: int | None
    campaign_id: int


class AuditEntry(BaseModel):
    event_id: int
    simulation_id: int
    created_at: datetime
    decision: dict


class ReportResponse(BaseModel):
    simulation_id: int
    reported: bool
    clicked: bool
    status: str
    event_created: bool


class ModelStatusResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    available: bool
    model_version: str | None = None
    status: str | None = None
    trained_at: str | None = None
    data_source: str | None = None
    note: str | None = None


def decision_response(decision, employee_id: int, data_source: str) -> "AgentDecisionResponse":
    """Build the API response from an ai.agent.AgentDecision dataclass."""
    values = {
        name: getattr(decision, name)
        for name in AgentDecisionResponse.model_fields
        if hasattr(decision, name)
    }
    return AgentDecisionResponse.model_validate(
        {**values, "employee_id": employee_id, "data_source": data_source}
    )
