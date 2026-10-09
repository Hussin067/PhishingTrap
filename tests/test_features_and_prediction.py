import json
from unittest import mock

import joblib
import pytest

from ai import prediction_service
from ai.features import build_feature_row, overall_features, scenario_features
from ai.model_config import FEATURES, MODEL_FILE, SCENARIOS
from ai.prediction_service import (
    ClickPredictor,
    InvalidFeaturesError,
    ModelUnavailableError,
)
from backend.app.templates.phishing_templates import PHISHING_TEMPLATES
from tests.synthetic import history_with_weakness, sim


# ---------------------------------------------------------------- features
def test_scenarios_match_backend_templates():
    assert set(SCENARIOS) == set(PHISHING_TEMPLATES)


def test_cold_start_features_are_zero():
    row = build_feature_row([], "invoice")
    assert row["total_simulations"] == 0
    assert row["scenario_attempts"] == 0
    assert row["click_rate"] == 0.0


def test_features_use_only_the_history_given():
    history = [sim("invoice", clicked=True), sim("invoice", reported=True), sim("hr_document")]
    row = build_feature_row(history, "invoice")
    assert row["total_simulations"] == 3
    assert row["scenario_attempts"] == 2
    assert row["scenario_clicks"] == 1
    assert row["scenario_click_rate"] == 0.5
    # Adding a later outcome must not change features computed from the earlier history.
    assert build_feature_row(history, "invoice") == row


def test_ignored_is_never_negative_when_clicked_and_reported():
    history = [sim("invoice", clicked=True, reported=True)]
    assert overall_features(history)["total_ignored"] == 0
    assert scenario_features(history, "invoice")["scenario_ignored"] == 0


# ------------------------------------------------------- model loading/prediction
def test_model_loads_and_predicts_probability(predictor):
    features = build_feature_row(history_with_weakness(), "hr_document")
    result = predictor.predict_click_probability(features)
    assert 0.0 <= result.click_probability <= 1.0
    assert result.model_version == "test-synthetic"
    assert result.model_status == "experimental"


def test_prediction_ignores_extra_non_model_keys_and_key_order(predictor):
    features = build_feature_row(history_with_weakness(), "hr_document")
    reordered = dict(reversed(list(features.items())))
    assert (
        predictor.predict_click_probability(features).click_probability
        == predictor.predict_click_probability(reordered).click_probability
    )


def test_model_is_loaded_only_once(trained_model_files):
    model_path, metadata_path = trained_model_files
    local = ClickPredictor(model_path, metadata_path)
    features = build_feature_row([], "invoice")
    with mock.patch.object(prediction_service.joblib, "load", wraps=joblib.load) as load:
        local.predict_click_probability(features)
        local.predict_click_probability(features)
        local.predict_many([features, features])
    assert load.call_count == 1


@pytest.mark.parametrize(
    "change",
    [
        {"phishing_type": "not_a_scenario"},
        {"total_simulations": -1},
        {"click_rate": 1.5},
        {"total_clicks": 99},  # more clicks than simulations
        {"scenario_clicks": 5},  # more scenario clicks than attempts
        {"recent_failures": 9},
    ],
)
def test_invalid_features_are_rejected(predictor, change):
    features = build_feature_row(history_with_weakness(), "hr_document")
    features.update(change)
    with pytest.raises(InvalidFeaturesError):
        predictor.predict_click_probability(features)


def test_missing_feature_and_wrong_type_are_rejected(predictor):
    features = build_feature_row([], "invoice")
    del features["click_rate"]
    with pytest.raises(InvalidFeaturesError):
        predictor.predict_click_probability(features)
    with pytest.raises(InvalidFeaturesError):
        predictor.predict_click_probability("not a dict")


def test_missing_model_file_is_handled(tmp_path):
    predictor = ClickPredictor(str(tmp_path / "nope.pkl"), str(tmp_path / "nope.json"))
    assert predictor.is_available() is False
    with pytest.raises(ModelUnavailableError):
        predictor.predict_click_probability(build_feature_row([], "invoice"))


def test_corrupt_model_file_is_handled(tmp_path, trained_model_files):
    bad_model = tmp_path / "bad.pkl"
    bad_model.write_bytes(b"not a pickle")
    predictor = ClickPredictor(str(bad_model), trained_model_files[1])
    with pytest.raises(ModelUnavailableError):
        predictor.predict_click_probability(build_feature_row([], "invoice"))


def test_feature_list_mismatch_is_refused(tmp_path, trained_model_files):
    model_path, metadata_path = trained_model_files
    metadata = json.loads(open(metadata_path, encoding="utf-8").read())
    metadata["features"] = FEATURES[:-1]
    changed = tmp_path / "changed.json"
    changed.write_text(json.dumps(metadata), encoding="utf-8")
    predictor = ClickPredictor(model_path, str(changed))
    with pytest.raises(ModelUnavailableError, match="different feature list"):
        predictor.predict_click_probability(build_feature_row([], "invoice"))


@pytest.mark.skipif(
    not __import__("os").path.isfile(MODEL_FILE), reason="saved model not trained on this machine"
)
def test_saved_project_model_loads():
    result = ClickPredictor().predict_click_probability(
        build_feature_row(history_with_weakness(), "hr_document")
    )
    assert 0.0 <= result.click_probability <= 1.0
    assert result.model_status == "experimental"
