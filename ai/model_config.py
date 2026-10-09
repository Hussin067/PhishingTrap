"""
Single source of truth for the click-prediction model.

Training, evaluation and the prediction service all import from here, so the
feature names, their order and the model settings cannot drift apart.

The model is trained on SYNTHETIC data only. See docs for its limitations.
"""

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_FILE = "ai/data/employee_behavior_features.csv"
MODEL_FILE = "ai/models/phishing_behavior_model.pkl"
METADATA_FILE = "ai/models/phishing_behavior_model.json"

TARGET = "current_clicked"

# Approved phishing scenarios. Must equal the keys of PHISHING_TEMPLATES in
# backend/app/templates/phishing_templates.py (a test enforces this).
SCENARIOS = (
    "password_reset",
    "account_verification",
    "invoice",
    "security_alert",
    "payment_request",
    "shipping_notification",
    "order_confirmation",
    "mfa_verification",
    "document_shared",
    "payroll_update",
    "hr_document",
    "benefits_update",
)

CATEGORICAL = ["phishing_type"]

NUMERICAL = [
    "total_simulations",
    "total_clicks",
    "total_reports",
    "total_ignored",
    "click_rate",
    "report_rate",
    "ignore_rate",
    "recent_failures",
    "scenario_attempts",
    "scenario_clicks",
    "scenario_click_rate",
]

FEATURES = CATEGORICAL + NUMERICAL


def build_pipeline():
    """
    Variant C from ai/calibration_experiment.py: no class_weight and
    min_samples_leaf=10, which gave the best-calibrated probabilities
    (Brier score below the constant-rate baseline on both splits).
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("phishing_type", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL)
        ],
        remainder="passthrough",
    )

    model = RandomForestClassifier(
        n_estimators=200,
        min_samples_leaf=10,
        random_state=42,
        n_jobs=-1,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )
