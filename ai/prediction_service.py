"""
Click-probability prediction service.

* Loads the saved scikit-learn pipeline ONCE (lazily, thread-safe) and reuses it.
* Validates every input before it reaches the model.
* Returns the probability together with the model version and status.
* Raises clear errors if the model file is missing, unreadable, or was trained
  with a different feature list than the code expects.

The model is EXPERIMENTAL and trained on synthetic data only: treat the
probability as weak evidence for ranking scenarios, not as a calibrated
real-world risk score.

The service has no database access. The backend supplies the features.
"""

import json
import os
import threading
from dataclasses import dataclass

import joblib
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from ai.model_config import FEATURES, METADATA_FILE, MODEL_FILE, SCENARIOS


class ModelUnavailableError(RuntimeError):
    """The model file/metadata is missing, unreadable or incompatible."""


class InvalidFeaturesError(ValueError):
    """The supplied features failed validation."""


class BehaviorFeatures(BaseModel):
    """Validated model input. Field names match ai.model_config.FEATURES."""

    model_config = ConfigDict(extra="forbid")

    phishing_type: str
    total_simulations: int = Field(ge=0)
    total_clicks: int = Field(ge=0)
    total_reports: int = Field(ge=0)
    total_ignored: int = Field(ge=0)
    click_rate: float = Field(ge=0.0, le=1.0)
    report_rate: float = Field(ge=0.0, le=1.0)
    ignore_rate: float = Field(ge=0.0, le=1.0)
    recent_failures: int = Field(ge=0, le=5)
    scenario_attempts: int = Field(ge=0)
    scenario_clicks: int = Field(ge=0)
    scenario_click_rate: float = Field(ge=0.0, le=1.0)

    @model_validator(mode="after")
    def check_consistency(self):
        if self.phishing_type not in SCENARIOS:
            raise ValueError(f"unknown phishing_type: {self.phishing_type!r}")
        if self.total_clicks > self.total_simulations:
            raise ValueError("total_clicks cannot exceed total_simulations")
        if self.total_reports > self.total_simulations:
            raise ValueError("total_reports cannot exceed total_simulations")
        if self.total_ignored > self.total_simulations:
            raise ValueError("total_ignored cannot exceed total_simulations")
        if self.scenario_attempts > self.total_simulations:
            raise ValueError("scenario_attempts cannot exceed total_simulations")
        if self.scenario_clicks > self.scenario_attempts:
            raise ValueError("scenario_clicks cannot exceed scenario_attempts")
        return self


@dataclass(frozen=True)
class PredictionResult:
    click_probability: float
    model_version: str
    model_status: str  # "experimental" for the synthetic-trained model


class ClickPredictor:
    def __init__(self, model_path: str = MODEL_FILE, metadata_path: str = METADATA_FILE):
        self._model_path = model_path
        self._metadata_path = metadata_path
        self._pipeline = None
        self._metadata: dict | None = None
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def _load(self):
        if self._pipeline is not None:
            return
        with self._lock:
            if self._pipeline is not None:
                return

            if not os.path.isfile(self._model_path):
                raise ModelUnavailableError(f"model file not found: {self._model_path}")
            if not os.path.isfile(self._metadata_path):
                raise ModelUnavailableError(
                    f"model metadata not found: {self._metadata_path}"
                )

            try:
                with open(self._metadata_path, encoding="utf-8") as file:
                    metadata = json.load(file)
                # joblib uses pickle: only ever load model files we trained.
                pipeline = joblib.load(self._model_path)
            except Exception as error:  # corrupt/unreadable files
                raise ModelUnavailableError(f"could not load model: {error}") from error

            if metadata.get("features") != FEATURES:
                raise ModelUnavailableError(
                    "model was trained with a different feature list than the "
                    "code expects; retrain with `python -m ai.train_model`"
                )
            if not hasattr(pipeline, "predict_proba"):
                raise ModelUnavailableError("loaded object has no predict_proba")

            self._metadata = metadata
            self._pipeline = pipeline

    def is_available(self) -> bool:
        try:
            self._load()
            return True
        except ModelUnavailableError:
            return False

    @property
    def metadata(self) -> dict:
        self._load()
        return dict(self._metadata)

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------
    @staticmethod
    def _validate(features: dict) -> BehaviorFeatures:
        # Extra keys such as recent_click_rate are produced by ai.features but
        # are not model inputs; drop them rather than failing.
        if not isinstance(features, dict):
            raise InvalidFeaturesError("features must be a dict")
        selected = {name: features[name] for name in FEATURES if name in features}
        try:
            return BehaviorFeatures(**selected)
        except ValidationError as error:
            raise InvalidFeaturesError(str(error)) from error

    def predict_click_probability(self, features: dict) -> PredictionResult:
        return self.predict_many([features])[0]

    def predict_many(self, feature_rows: list[dict]) -> list[PredictionResult]:
        self._load()
        validated = [self._validate(row) for row in feature_rows]
        if not validated:
            return []

        frame = pd.DataFrame([row.model_dump() for row in validated])[FEATURES]
        probabilities = self._pipeline.predict_proba(frame)[:, 1]

        return [
            PredictionResult(
                click_probability=round(float(probability), 4),
                model_version=self._metadata["model_version"],
                model_status=self._metadata.get("status", "unknown"),
            )
            for probability in probabilities
        ]


_default_predictor: ClickPredictor | None = None
_default_lock = threading.Lock()


def get_predictor() -> ClickPredictor:
    """Process-wide predictor: the model is loaded once and reused."""
    global _default_predictor
    with _default_lock:
        if _default_predictor is None:
            _default_predictor = ClickPredictor()
        return _default_predictor
