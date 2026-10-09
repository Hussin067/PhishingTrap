"""
Admin portal tests: authentication, access control, dashboards, campaigns.
All data is SYNTHETIC test data in an in-memory SQLite database.
"""

import time
from datetime import datetime, timedelta

import pytest

from backend.app import admin_auth
from database import models
from tests.conftest import TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
from tests.synthetic import add_history

WEAK = (
    [("hr_document", True, False), ("password_reset", False, True)] * 4
    + [("invoice", False, True)] * 2
)

ADMIN_GET_PATHS = [
    "/admin/me",
    "/admin/overview",
    "/admin/employees",
    "/admin/employees/1",
    "/admin/weakness-matrix",
    "/admin/campaigns",
    "/admin/campaigns/1",
    "/ai/model-status",
    "/employees/1/scenario-analysis",
    "/employees/1/scenarios/invoice/click-probability",
    "/employees/1/agent/audit",
]


def _login(client, email=TEST_ADMIN_EMAIL, password=TEST_ADMIN_PASSWORD):
    return client.post("/admin/login", json={"email": email, "password": password})


# ------------------------------------------------------------------- auth
def test_login_success_returns_working_token(anon_client):
    response = _login(anon_client)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == TEST_ADMIN_EMAIL and body["expires_at"] > time.time()
    me = anon_client.get("/admin/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200 and me.json() == {"email": TEST_ADMIN_EMAIL}


def test_login_is_case_insensitive_on_email(anon_client):
    assert _login(anon_client, email="  ADMIN@Example.TEST ").status_code == 200


@pytest.mark.parametrize(
    "email,password",
    [(TEST_ADMIN_EMAIL, "wrong"), ("nobody@example.test", TEST_ADMIN_PASSWORD), ("", "")],
)
def test_bad_credentials_are_rejected_with_same_message(anon_client, email, password):
    response = _login(anon_client, email, password)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_is_throttled_after_repeated_failures(anon_client):
    for _ in range(admin_auth.LOGIN_MAX_FAILURES):
        assert _login(anon_client, password="wrong").status_code == 401
    assert _login(anon_client, password="wrong").status_code == 429
    # Even the correct password is refused while blocked.
    assert _login(anon_client).status_code == 429


def test_admin_disabled_when_not_configured(anon_client, monkeypatch):
    token, _ = admin_auth.create_token(TEST_ADMIN_EMAIL)  # valid while configured
    monkeypatch.delenv("ADMIN_PASSWORD_HASH")
    assert _login(anon_client).status_code == 503
    # Fail closed: even a previously valid token stops working.
    response = anon_client.get("/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_short_secret_disables_admin(anon_client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN_SECRET", "too-short")
    assert admin_auth.admin_configured() is False
    assert _login(anon_client).status_code == 503


@pytest.mark.parametrize("path", ADMIN_GET_PATHS)
def test_protected_endpoints_require_a_token(anon_client, path):
    assert anon_client.get(path).status_code == 401


def test_protected_post_endpoints_require_a_token(anon_client):
    assert anon_client.post("/admin/campaigns/run", json={"name": "x", "mode": "fixed", "scenario": "invoice"}).status_code == 401
    assert anon_client.post("/employees/1/agent/decision", json={}).status_code == 401
    assert anon_client.post("/employees/1/agent/execute", json={"confirm": True, "approved_by": "x"}).status_code == 401


def test_tampered_expired_and_foreign_tokens_are_rejected(anon_client):
    token, _ = admin_auth.create_token(TEST_ADMIN_EMAIL)
    payload, signature = token.split(".")
    bad = [
        f"{payload}.{'A' * len(signature)}",  # wrong signature
        f"{payload[:-2]}xx.{signature}",  # modified payload
        "garbage",
        "",
    ]
    expired, _ = admin_auth.create_token(TEST_ADMIN_EMAIL, now=time.time() - 10 * 3600)
    bad.append(expired)
    other, _ = admin_auth.create_token("someone-else@example.test")  # right secret, wrong subject
    bad.append(other)
    for candidate in bad:
        response = anon_client.get("/admin/me", headers={"Authorization": f"Bearer {candidate}"})
        assert response.status_code == 401, candidate[:20]


def test_employee_tracking_endpoints_stay_public(anon_client, db, employee, awareness_campaign):
    simulation = add_history(db, models, employee.id, awareness_campaign.id, [("invoice", False, False)])[0]
    assert anon_client.get(f"/simulations/click/{simulation.id}").status_code == 200
    assert anon_client.post(f"/simulations/{simulation.id}/report").status_code == 200
    assert anon_client.get("/health").status_code == 200


# --------------------------------------------------------------- dashboards
def test_employees_table_shows_weakness_with_evidence(client, db, employee, awareness_campaign):
    other = models.Employee(name="Newcomer", email="new@example.test", department="Ops")
    db.add(other)
    db.commit()
    add_history(db, models, employee.id, awareness_campaign.id, WEAK)

    rows = {r["employee_id"]: r for r in client.get("/admin/employees").json()["employees"]}
    weak = rows[employee.id]
    assert weak["top_weakness"]["scenario"] == "hr_document"
    assert (weak["top_weakness"]["clicks"], weak["top_weakness"]["attempts"]) == (4, 4)
    assert weak["simulations"] == len(WEAK) and weak["clicks"] == 4

    new = rows[other.id]
    assert new["risk_level"] == "insufficient_data"
    assert new["top_weakness"] is None  # no weakness claims without evidence


def test_synthetic_data_hidden_unless_requested(client, db, employee, synthetic_campaign):
    add_history(db, models, employee.id, synthetic_campaign.id, [("hr_document", True, False)] * 8)
    default = client.get("/admin/overview").json()
    assert default["simulations_total"] == 0 and default["data_source"] == "real_only"
    demo = client.get("/admin/overview?include_synthetic=true").json()
    assert demo["simulations_total"] == 8 and demo["data_source"] == "includes_synthetic"
    assert client.get("/admin/campaigns").json()["campaigns"] == []
    shown = client.get("/admin/campaigns?include_synthetic=true").json()["campaigns"]
    assert shown[0]["is_synthetic"] is True


def test_overview_numbers_and_structure(client, db, employee, awareness_campaign):
    add_history(db, models, employee.id, awareness_campaign.id, WEAK)
    body = client.get("/admin/overview").json()
    assert body["employees_total"] == 1
    assert body["simulations_total"] == len(WEAK) and body["clicks"] == 4
    assert len(body["scenario_stats"]) == 12
    hr = next(s for s in body["scenario_stats"] if s["scenario"] == "hr_document")
    assert (hr["attempts"], hr["clicks"], hr["click_rate"]) == (4, 4, 1.0)
    assert body["model"]["available"] is True
    assert sum(body["risk_distribution"].values()) == 1
    assert body["department_stats"][0]["department"] == "QA"


def test_weakness_matrix_has_a_cell_per_scenario(client, db, employee, awareness_campaign):
    add_history(db, models, employee.id, awareness_campaign.id, WEAK)
    body = client.get("/admin/weakness-matrix").json()
    assert len(body["scenarios"]) == 12 and len(body["employees"][0]["cells"]) == 12
    cell = next(c for c in body["employees"][0]["cells"] if c["scenario"] == "hr_document")
    assert cell["established"] is True and cell["evidence_level"] == "moderate"
    unseen = next(c for c in body["employees"][0]["cells"] if c["scenario"] == "benefits_update")
    assert unseen["established"] is False and unseen["attempts"] == 0


def test_employee_detail_activity_and_privacy(client, db, employee, awareness_campaign):
    employee.password_hash = "SECRET-HASH-VALUE"
    db.commit()
    sims = add_history(db, models, employee.id, awareness_campaign.id, WEAK)
    client.get(f"/simulations/click/{sims[1].id}")  # existing click tracking

    response = client.get(f"/admin/employees/{employee.id}")
    assert response.status_code == 200
    body = response.json()
    assert "SECRET-HASH-VALUE" not in response.text and "password_hash" not in response.text
    assert body["employee"]["email"] == employee.email  # admins may see contact details
    assert body["top_weakness"]["scenario"] == "hr_document"
    assert len(body["assessments"]) == 12
    assert body["agent_proposal"]["training_recommendation"]["topic"] == "hr_document"
    types = [entry["type"] for entry in body["activity"]]
    assert "click" in types and "simulation_sent" in types
    assert body["disclaimer"]


def test_employee_and_campaign_not_found(client):
    assert client.get("/admin/employees/9999").status_code == 404
    assert client.get("/admin/campaigns/9999").status_code == 404


def test_campaign_detail_lists_each_employee_result(client, db, employee, awareness_campaign):
    add_history(db, models, employee.id, awareness_campaign.id, WEAK)
    body = client.get(f"/admin/campaigns/{awareness_campaign.id}").json()
    assert body["simulations"] == len(WEAK) and body["clicks"] == 4
    assert body["results"][0]["employee_name"] == employee.name


# ---------------------------------------------------------------- campaigns
def _run(client, **overrides):
    body = {"name": "Q3 Phish Test", "mode": "fixed", "scenario": "invoice", "dry_run": False, "confirm": True}
    body.update(overrides)
    return client.post("/admin/campaigns/run", json=body)


@pytest.fixture()
def team(db):
    people = [
        models.Employee(name=f"Person {i}", email=f"p{i}@example.test", department="QA")
        for i in range(3)
    ]
    inactive = models.Employee(name="Gone", email="gone@example.test", department="QA", is_active=False)
    db.add_all(people + [inactive])
    db.commit()
    return people, inactive


def test_dry_run_is_the_default_and_writes_nothing(client, db, team):
    response = client.post("/admin/campaigns/run", json={"name": "Preview only", "mode": "fixed", "scenario": "invoice"})
    assert response.status_code == 200
    body = response.json()
    assert body["dry_run"] is True and body["campaign_id"] is None
    assert len(body["planned"]) == 3
    assert db.query(models.Campaign).count() == 0 and db.query(models.Simulation).count() == 0


def test_running_requires_confirmation(client, db, team):
    response = _run(client, confirm=False)
    assert response.status_code == 400
    assert db.query(models.Campaign).count() == 0


def test_fixed_campaign_creates_one_simulation_per_active_employee(client, db, team):
    people, inactive = team
    response = _run(client)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["dry_run"] is False and body["delivery"] == "not_configured"
    assert len(body["planned"]) == 3  # inactive employee excluded
    campaign = db.get(models.Campaign, body["campaign_id"])
    sims = db.query(models.Simulation).filter_by(campaign_id=campaign.id).all()
    assert {s.employee_id for s in sims} == {p.id for p in people}
    assert all(s.phishing_type == "invoice" and s.status == "sent" for s in sims)
    # Audit trail names the approving admin; preview link works with existing endpoint.
    events = db.query(models.Event).filter_by(event_type="campaign_launch").all()
    assert len(events) == 3 and all(TEST_ADMIN_EMAIL in e.description for e in events)
    assert client.get(body["planned"][0]["preview_path"]).status_code == 200


def test_targeting_specific_employees_reports_skips(client, db, team):
    people, inactive = team
    body = _run(client, employee_ids=[people[0].id, inactive.id, 9999, people[0].id]).json()
    assert len(body["planned"]) == 1
    reasons = {(s["employee_id"], s["reason"]) for s in body["skipped"]}
    assert reasons == {(inactive.id, "inactive"), (9999, "not_found")}


def test_duplicate_campaign_name_is_refused(client, db, team):
    assert _run(client).status_code == 200
    again = _run(client)
    assert again.status_code == 409
    assert db.query(models.Campaign).count() == 1
    assert _run(client, name="q3 phish test").status_code == 409  # case-insensitive


def test_recently_simulated_employees_are_skipped(client, db, team):
    people, _ = team
    first = _run(client, name="Round 1", employee_ids=[people[0].id])
    assert first.status_code == 200
    second = _run(client, name="Round 2", employee_ids=[people[0].id, people[1].id]).json()
    assert [p["employee_id"] for p in second["planned"]] == [people[1].id]
    assert second["skipped"] == [{"employee_id": people[0].id, "reason": "recent_simulation"}]


def test_everyone_skipped_is_an_error(client, db, team):
    people, _ = team
    assert _run(client, name="A", employee_ids=[people[0].id]).status_code == 200
    assert _run(client, name="B", employee_ids=[people[0].id]).status_code == 422


@pytest.mark.parametrize(
    "overrides",
    [
        {"scenario": "not_a_scenario"},
        {"scenario": None},  # fixed mode needs a scenario
        {"mode": "teleport"},
        {"name": "   "},
        {"name": "ML Synthetic Training Dataset v1"},
        {"name": "ai adaptive simulations"},
        {"unexpected": "field"},
    ],
)
def test_invalid_campaign_requests_are_rejected(client, db, team, overrides):
    assert _run(client, **overrides).status_code == 422
    assert db.query(models.Simulation).count() == 0


def test_adaptive_campaign_personalises_scenarios_and_training(client, db, team, awareness_campaign):
    people, _ = team
    add_history(db, models, people[0].id, awareness_campaign.id, WEAK)
    swapped = [("password_reset", True, False), ("hr_document", False, True)] * 4 + [("invoice", False, True)] * 2
    add_history(db, models, people[1].id, awareness_campaign.id, swapped)
    # Make the earlier history old enough that nobody is "recently simulated".
    for sim in db.query(models.Simulation).all():
        sim.created_at = datetime.utcnow() - timedelta(days=10)
    db.commit()

    response = _run(client, name="Adaptive round", mode="adaptive", scenario=None)
    assert response.status_code == 200, response.text
    planned = {p["employee_id"]: p for p in response.json()["planned"]}
    assert planned[people[0].id]["training_topic"] == "hr_document"
    assert planned[people[1].id]["training_topic"] == "password_reset"
    assert planned[people[2].id]["training_topic"] is None  # cold start: no claims
    assert planned[people[2].id]["difficulty"] == "easy"
    assert all(p["scenario"] for p in planned.values())

    topics = {t.employee_id: t.category for t in db.query(models.Training).all()}
    assert topics == {people[0].id: "hr_document", people[1].id: "password_reset"}
    audits = db.query(models.Event).filter_by(event_type="agent_decision").all()
    assert len(audits) == 3 and all(TEST_ADMIN_EMAIL in e.description for e in audits)


def test_adaptive_campaign_without_training_assignment(client, db, team, awareness_campaign):
    people, _ = team
    add_history(db, models, people[0].id, awareness_campaign.id, WEAK)
    for sim in db.query(models.Simulation).all():
        sim.created_at = datetime.utcnow() - timedelta(days=10)
    db.commit()
    response = _run(client, name="No training", mode="adaptive", scenario=None, assign_training=False)
    assert response.status_code == 200
    assert db.query(models.Training).count() == 0


def test_campaign_results_flow_into_dashboard(client, db, team):
    people, _ = team
    body = _run(client).json()
    sim_id = body["planned"][0]["simulation_id"]
    client.get(f"/simulations/click/{sim_id}")  # employee clicks (existing endpoint)
    detail = client.get(f"/admin/campaigns/{body['campaign_id']}").json()
    assert detail["simulations"] == 3 and detail["clicks"] == 1
    listing = client.get("/admin/campaigns").json()["campaigns"]
    assert listing[0]["name"] == "Q3 Phish Test" and listing[0]["clicks"] == 1
