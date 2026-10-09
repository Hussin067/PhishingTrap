import pytest

from ai.agent import AgentValidationError, decide_next_action
from ai.model_config import SCENARIOS
from ai.prediction_service import ClickPredictor
from ai.vulnerability import analyze_scenarios, wilson_interval
from tests.synthetic import history_with_weakness, sim


# ------------------------------------------------------------ vulnerability
def test_wilson_interval_is_wide_for_no_data_and_narrows_with_data():
    assert wilson_interval(0, 0) == (0.0, 1.0)
    low_small, high_small = wilson_interval(2, 4)
    low_big, high_big = wilson_interval(20, 40)
    assert (high_big - low_big) < (high_small - low_small)


def test_analysis_reports_observation_counts_and_cold_start_notes():
    analysis = analyze_scenarios([sim("invoice", clicked=True)], list(SCENARIOS))
    by = {a.scenario: a for a in analysis.assessments}
    assert analysis.summary.cold_start is True
    assert by["invoice"].attempts == 1 and by["invoice"].evidence_level == "low"
    assert by["hr_document"].attempts == 0 and by["hr_document"].evidence_level == "none"
    assert any("unreliable" in note for note in by["invoice"].notes)
    assert any("No history" in note for note in by["hr_document"].notes)


def test_smoothing_keeps_sparse_estimates_away_from_extremes():
    analysis = analyze_scenarios([sim("invoice", clicked=True)], ["invoice"])
    assessment = analysis.assessments[0]
    assert assessment.observed_click_rate == 1.0
    assert assessment.smoothed_click_rate < 0.6  # one click must not mean "100% vulnerable"


def test_ml_probability_is_attached_when_model_is_available(predictor):
    analysis = analyze_scenarios(history_with_weakness(), ["hr_document", "invoice"], predictor)
    assert analysis.model_used is True
    assert analysis.model_version == "test-synthetic"
    assert all(a.ml_click_probability is not None for a in analysis.assessments)


def test_analysis_falls_back_to_statistics_when_model_missing(tmp_path):
    broken = ClickPredictor(str(tmp_path / "x.pkl"), str(tmp_path / "x.json"))
    analysis = analyze_scenarios(history_with_weakness(), ["hr_document"], broken)
    assert analysis.model_used is False
    assert analysis.warnings and "statistics only" in analysis.warnings[0]
    assert analysis.assessments[0].ml_click_probability is None


# -------------------------------------------------------------------- agent
def test_selected_scenario_is_always_approved():
    for history in ([], history_with_weakness()):
        decision = decide_next_action(history, SCENARIOS)
        assert decision.proposed_simulation.scenario in SCENARIOS


def test_unapproved_or_empty_candidates_are_rejected():
    with pytest.raises(AgentValidationError):
        decide_next_action([], ["invoice", "make_up_a_scenario"])
    with pytest.raises(AgentValidationError):
        decide_next_action([], [])


def test_candidates_limit_the_choice():
    decision = decide_next_action(history_with_weakness(), ["invoice", "benefits_update"])
    assert decision.proposed_simulation.scenario in {"invoice", "benefits_update"}


def test_cold_start_gets_gentle_baseline_and_no_training():
    decision = decide_next_action([], SCENARIOS)
    assert decision.mode == "cold_start"
    assert decision.confidence == "low"
    assert decision.proposed_simulation.difficulty == "easy"
    assert decision.training_recommendation is None
    assert decision.limitations  # limitations are always stated


def test_different_histories_get_different_recommendations():
    employee_a = history_with_weakness(weak="hr_document", strong="password_reset")
    employee_b = history_with_weakness(weak="password_reset", strong="hr_document")
    rec_a = decide_next_action(employee_a, SCENARIOS).training_recommendation
    rec_b = decide_next_action(employee_b, SCENARIOS).training_recommendation
    assert rec_a is not None and rec_b is not None
    assert rec_a.topic == "hr_document"
    assert rec_b.topic == "password_reset"


def test_differences_also_hold_with_the_ml_model(predictor):
    a = decide_next_action(history_with_weakness("hr_document", "password_reset"), SCENARIOS, predictor)
    b = decide_next_action(history_with_weakness("password_reset", "hr_document"), SCENARIOS, predictor)
    assert a.model_used and b.model_used
    assert a.training_recommendation.topic == "hr_document"
    assert b.training_recommendation.topic == "password_reset"


def test_no_training_without_enough_evidence():
    # One click in one attempt is a hint, not an established weakness.
    history = [sim("invoice", reported=True)] * 5 + [sim("hr_document", clicked=True)]
    decision = decide_next_action(history, SCENARIOS)
    assert decision.training_recommendation is None


def test_does_not_repeat_previous_scenario_back_to_back():
    history = history_with_weakness()
    last = history[-1].phishing_type
    decision = decide_next_action(history, SCENARIOS)
    assert decision.proposed_simulation.scenario != last


def test_scenario_with_open_training_is_not_tested_yet():
    history = history_with_weakness(weak="hr_document")
    decision = decide_next_action(
        history, SCENARIOS, open_training_topics={"hr_document"}
    )
    assert decision.proposed_simulation.scenario != "hr_document"
    assert decision.training_recommendation.already_assigned is True


def test_completed_training_leads_to_refresher_note_if_weakness_persists():
    decision = decide_next_action(
        history_with_weakness(), SCENARIOS, completed_training_topics={"hr_document"}
    )
    assert "refresher" in decision.training_recommendation.reason


def test_difficulty_is_easier_for_frequent_clickers():
    clicker = [sim(s, clicked=True) for s in SCENARIOS] * 2
    careful = [sim(s, reported=True) for s in SCENARIOS] * 3
    assert decide_next_action(clicker, SCENARIOS).proposed_simulation.difficulty == "easy"
    assert decide_next_action(careful, SCENARIOS).proposed_simulation.difficulty == "hard"
