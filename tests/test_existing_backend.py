"""Regression tests: existing endpoints keep working (SYNTHETIC test data, SQLite)."""

from database import models


def test_health_and_root(client):
    assert client.get("/health").json() == {"status": "healthy"}
    assert "running" in client.get("/").json()["message"]


def test_employee_campaign_simulation_flow(client):
    employee = client.post(
        "/employees", params={"name": "Reg Test", "email": "reg@example.test", "department": "QA"}
    ).json()
    campaign = client.post(
        "/campaigns", params={"name": "Regression campaign", "description": "test"}
    ).json()
    simulation = client.post(
        "/simulations",
        params={
            "employee_id": employee["id"],
            "campaign_id": campaign["id"],
            "email_subject": "Test",
            "phishing_type": "invoice",
        },
    ).json()
    assert simulation["status"] == "sent" and simulation["clicked"] is False

    # Email generation and preview use the existing template renderer.
    generated = client.get(f"/simulations/{simulation['id']}/preview")
    assert generated.status_code == 200 and "Review Now" in generated.text
    assert "email" in client.post(f"/simulations/{simulation['id']}/generate").json()

    # Existing click tracking.
    click = client.get(f"/simulations/click/{simulation['id']}").json()
    assert click["clicked"] is True and click["status"] == "clicked"

    # Existing rule-based risk endpoint is unchanged.
    risk = client.get(f"/employees/{employee['id']}/risk").json()
    assert risk["total_simulations"] == 1 and risk["clicked_simulations"] == 1
    assert risk["risk_level"] == "high"


def test_preview_unknown_simulation_is_404(client):
    assert client.get("/simulations/9999/preview").status_code == 404


def test_training_questions_and_submit(client, db, employee):
    training = models.Training(employee_id=employee.id, title="t", content="c", category="general")
    db.add(training)
    db.commit()
    client.post(
        f"/trainings/{training.id}/questions",
        json={"question": "q?", "options": ["a", "b"], "correct_answer": "B", "explanation": "e"},
    )
    question = client.get(f"/trainings/{training.id}/questions").json()[0]
    result = client.post(
        f"/trainings/{training.id}/submit", json={"answers": {question["id"]: "B"}}
    ).json()
    assert result["score"] == 100 and result["passed"] is True


def test_db_test_endpoint_works(client):
    # `text` was previously not imported in main.py, so this endpoint raised NameError.
    assert client.get("/db-test").json() == {"database": 1}
