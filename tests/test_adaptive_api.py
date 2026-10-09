"""
End-to-end tests of the adaptive loop through the HTTP API.
All data is SYNTHETIC test data in an in-memory SQLite database.
"""

from datetime import datetime, timedelta

from ai.prediction_service import ClickPredictor, get_predictor
from database import models
from tests.synthetic import add_history

WEAK_HISTORY = (
    [("hr_document", True, False), ("password_reset", False, True)] * 4
    + [("invoice", False, True)] * 2
)


def _employee_with_weakness(db, employee, awareness_campaign):
    add_history(db, models, employee.id, awareness_campaign.id, WEAK_HISTORY)


def _decision(client, employee_id, **body):
    return client.post(f"/employees/{employee_id}/agent/decision", json=body)


def _execute(client, employee_id, **body):
    body.setdefault("confirm", True)
    body.setdefault("approved_by", "admin@example.test")
    return client.post(f"/employees/{employee_id}/agent/execute", json=body)


# ------------------------------------------------------------ read endpoints
def test_model_status(client):
    body = client.get("/ai/model-status").json()
    assert body["available"] is True
    assert body["status"] == "experimental"


def test_scenario_analysis_shape_and_no_sensitive_data(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    response = client.get(f"/employees/{employee.id}/scenario-analysis")
    assert response.status_code == 200
    body = response.json()
    assert len(body["assessments"]) == 12
    assert body["data_source"] == "real_only"
    assert body["disclaimer"]
    text = response.text
    assert "password_hash" not in text and "@" not in text and employee.email not in text and employee.name not in text
    hr = next(a for a in body["assessments"] if a["scenario"] == "hr_document")
    assert hr["attempts"] == 4 and hr["clicks"] == 4


def test_click_probability_endpoint(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    response = client.get(f"/employees/{employee.id}/scenarios/hr_document/click-probability")
    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["click_probability"] <= 1.0
    assert body["scenario_attempts"] == 4
    assert body["model_status"] == "experimental"


def test_identifiers_are_validated(client, db, employee):
    assert client.get("/employees/9999/scenario-analysis").status_code == 404
    assert client.get(f"/employees/{employee.id}/scenarios/bogus/click-probability").status_code == 422
    assert client.get(f"/employees/{employee.id}/scenario-analysis?scenarios=invoice,bogus").status_code == 422
    assert _decision(client, employee.id, candidate_scenarios=["bogus"]).status_code == 422
    assert _decision(client, 9999).status_code == 404


def test_inactive_employee_is_refused(client, db, employee):
    employee.is_active = False
    db.commit()
    assert _decision(client, employee.id).status_code == 409


def test_click_probability_503_when_model_missing(client, tmp_path, employee):
    from backend.app.main import app

    app.dependency_overrides[get_predictor] = lambda: ClickPredictor(
        str(tmp_path / "missing.pkl"), str(tmp_path / "missing.json")
    )
    response = client.get(f"/employees/{employee.id}/scenarios/invoice/click-probability")
    assert response.status_code == 503
    # The agent still works (statistics only) without the model.
    decision = _decision(client, employee.id)
    assert decision.status_code == 200
    assert decision.json()["model_used"] is False


# ------------------------------------------------------------ synthetic policy
def test_synthetic_data_is_excluded_unless_requested(client, db, employee, synthetic_campaign):
    add_history(db, models, employee.id, synthetic_campaign.id, [("hr_document", True, False)] * 6)
    default = client.get(f"/employees/{employee.id}/scenario-analysis").json()
    assert default["summary"]["total_simulations"] == 0
    included = client.get(f"/employees/{employee.id}/scenario-analysis?include_synthetic=true").json()
    assert included["summary"]["total_simulations"] == 6
    assert included["data_source"] == "includes_synthetic"


# ------------------------------------------------------------ agent decision
def test_cold_start_decision_through_api(client, employee):
    body = _decision(client, employee.id).json()
    assert body["mode"] == "cold_start"
    assert body["training_recommendation"] is None
    assert body["proposed_simulation"]["difficulty"] == "easy"
    assert body["executed"] is False


def test_decision_has_no_side_effects(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    before = db.query(models.Simulation).count()
    body = _decision(client, employee.id).json()
    assert body["training_recommendation"]["topic"] == "hr_document"
    assert db.query(models.Simulation).count() == before
    assert db.query(models.Training).count() == 0


def test_different_employees_get_different_recommendations(client, db, awareness_campaign):
    a = models.Employee(name="A", email="a@example.test", department="QA")
    b = models.Employee(name="B", email="b@example.test", department="QA")
    db.add_all([a, b])
    db.commit()
    add_history(db, models, a.id, awareness_campaign.id, WEAK_HISTORY)
    swapped = [("password_reset", True, False), ("hr_document", False, True)] * 4 + [("invoice", False, True)] * 2
    add_history(db, models, b.id, awareness_campaign.id, swapped)
    topic_a = _decision(client, a.id).json()["training_recommendation"]["topic"]
    topic_b = _decision(client, b.id).json()["training_recommendation"]["topic"]
    assert (topic_a, topic_b) == ("hr_document", "password_reset")


# ------------------------------------------------------------ execution
def test_execute_requires_explicit_confirmation(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    response = _execute(client, employee.id, confirm=False)
    assert response.status_code == 400
    assert db.query(models.Training).count() == 0


def test_full_adaptive_loop(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)

    # 1. Agent proposes; admin approves with the scenario they saw.
    proposal = _decision(client, employee.id).json()
    scenario = proposal["proposed_simulation"]["scenario"]
    response = _execute(client, employee.id, expected_scenario=scenario)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["scenario"] == scenario

    # 2. The simulation is stored correctly, in the dedicated adaptive campaign,
    #    and the existing preview endpoint renders it.
    simulation = db.get(models.Simulation, result["simulation_id"])
    assert simulation.employee_id == employee.id
    assert simulation.phishing_type == scenario
    assert simulation.clicked is False and simulation.reported is False
    assert db.get(models.Campaign, simulation.campaign_id).name == "AI Adaptive Simulations"
    preview = client.get(result["preview_path"])
    assert preview.status_code == 200 and "<html" in preview.text.lower()

    # 3. Training (existing Training/TrainingQuestion tables) with working questions.
    assert result["training_id"] is not None
    training = db.get(models.Training, result["training_id"])
    assert training.category == "hr_document" and training.completed is False
    questions = client.get(f"/trainings/{training.id}/questions").json()
    assert len(questions) == 2

    # 4. The decision is auditable.
    audit = client.get(f"/employees/{employee.id}/agent/audit").json()
    assert len(audit) == 1
    assert audit[0]["simulation_id"] == simulation.id
    assert audit[0]["decision"]["approved_by"] == "admin@example.test"
    assert audit[0]["decision"]["scenario"] == scenario
    assert audit[0]["decision"]["model_version"] == "test-synthetic"

    # 5. Duplicate guard: a second execution inside the cooldown is refused.
    again = _execute(client, employee.id)
    assert again.status_code == 409
    assert db.query(models.Simulation).filter_by(campaign_id=simulation.campaign_id).count() == 1

    # 6. Outcomes recorded through the EXISTING click/report tracking...
    assert client.get(f"/simulations/click/{simulation.id}").status_code == 200
    assert client.post(f"/simulations/{simulation.id}/report").json()["event_created"] is True
    assert client.post(f"/simulations/{simulation.id}/report").json()["event_created"] is False  # idempotent

    # ...and are visible to the next analysis.
    after = client.get(f"/employees/{employee.id}/scenario-analysis").json()
    assert after["summary"]["total_simulations"] == len(WEAK_HISTORY) + 1
    row = next(a for a in after["assessments"] if a["scenario"] == scenario)
    expected_attempts = sum(1 for s, _, _ in WEAK_HISTORY if s == scenario) + 1
    assert row["attempts"] == expected_attempts

    # 7. Completing the assigned training works with the existing submit endpoint,
    #    and the next decision no longer says it is "already assigned".
    answers = {q["id"]: "B" for q in questions}
    submit = client.post(f"/trainings/{training.id}/submit", json={"answers": answers})
    assert submit.status_code == 200 and submit.json()["completed"] is True

    simulation.created_at = datetime.utcnow() - timedelta(days=2)  # leave the cooldown window
    db.commit()
    next_decision = _decision(client, employee.id).json()
    recommendation = next_decision["training_recommendation"]
    if recommendation is not None and recommendation["topic"] == "hr_document":
        assert recommendation["already_assigned"] is False


def test_stale_proposal_is_refused(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    proposed = _decision(client, employee.id).json()["proposed_simulation"]["scenario"]
    other = "benefits_update" if proposed != "benefits_update" else "invoice"
    response = _execute(client, employee.id, expected_scenario=other)
    assert response.status_code == 409
    assert db.query(models.Training).count() == 0
    assert db.query(models.Event).filter_by(event_type="agent_decision").count() == 0


def test_client_cannot_inject_a_scenario(client, db, employee):
    response = client.post(
        f"/employees/{employee.id}/agent/execute",
        json={"confirm": True, "approved_by": "x", "scenario": "not_approved"},
    )
    # Unknown fields are ignored; the proposal always comes from the server-side agent.
    assert response.status_code == 200
    assert response.json()["scenario"] in {
        "password_reset", "account_verification", "invoice", "security_alert",
        "payment_request", "shipping_notification", "order_confirmation",
        "mfa_verification", "document_shared", "payroll_update", "hr_document",
        "benefits_update",
    }


def test_training_not_duplicated_when_already_assigned(client, db, employee, awareness_campaign):
    _employee_with_weakness(db, employee, awareness_campaign)
    first = _execute(client, employee.id).json()
    sim = db.get(models.Simulation, first["simulation_id"])
    sim.created_at = datetime.utcnow() - timedelta(days=2)
    db.commit()
    second = _execute(client, employee.id)
    assert second.status_code == 200
    assert second.json()["training_id"] is None  # already assigned and still open
    assert db.query(models.Training).filter_by(category="hr_document").count() == 1


def test_report_unknown_simulation_is_404(client):
    assert client.post("/simulations/9999/report").status_code == 404
