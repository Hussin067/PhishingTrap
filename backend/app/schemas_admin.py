"""Request/response schemas for the admin portal (login and campaign run)."""

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ai.model_config import SCENARIOS


class AdminLoginRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=200)


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: int  # unix seconds
    email: str


class CampaignRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    mode: str = Field(description="'fixed' (one scenario for everyone) or 'adaptive' (agent per employee)")
    scenario: str | None = None
    employee_ids: list[int] | None = Field(
        default=None, max_length=500, description="Omit to target all active employees."
    )
    assign_training: bool = True
    include_synthetic: bool = False
    use_model: bool = True
    dry_run: bool = True
    confirm: bool = Field(default=False, description="Must be true when dry_run is false.")

    @field_validator("mode")
    @classmethod
    def _mode(cls, value):
        if value not in ("fixed", "adaptive"):
            raise ValueError("mode must be 'fixed' or 'adaptive'")
        return value

    @field_validator("scenario")
    @classmethod
    def _scenario(cls, value):
        if value is not None and value not in SCENARIOS:
            raise ValueError(f"unapproved scenario: {value!r}")
        return value


class PlannedSimulation(BaseModel):
    employee_id: int
    employee_name: str
    scenario: str
    difficulty: str | None
    training_topic: str | None
    simulation_id: int | None
    training_id: int | None
    preview_path: str | None


class SkippedEmployee(BaseModel):
    employee_id: int
    reason: str


class CampaignRunResponse(BaseModel):
    name: str
    mode: str
    data_source: str
    delivery: str
    dry_run: bool
    campaign_id: int | None
    planned: list[PlannedSimulation]
    skipped: list[SkippedEmployee]
