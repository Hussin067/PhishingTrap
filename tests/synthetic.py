"""
SYNTHETIC test fixtures. Everything here is invented for testing; none of it
is real employee behaviour.
"""

import random
from datetime import datetime, timedelta
from types import SimpleNamespace

from ai.features import build_feature_row
from ai.model_config import SCENARIOS


def sim(phishing_type, clicked=False, reported=False):
    """A simulation-like record (what the agent receives from the backend)."""
    return SimpleNamespace(phishing_type=phishing_type, clicked=clicked, reported=reported)


def history_with_weakness(weak="hr_document", strong="password_reset", n=4):
    """SYNTHETIC history: always clicks `weak`, always reports `strong`."""
    records = []
    for _ in range(n):
        records.append(sim(weak, clicked=True))
        records.append(sim(strong, reported=True))
    records.append(sim("invoice", reported=True))
    records.append(sim("invoice", reported=True))
    return records


def training_rows(employees=10, simulations=60, seed=7):
    """SYNTHETIC feature rows with a built-in scenario/employee effect."""
    rng = random.Random(seed)
    rows = []
    for employee in range(employees):
        weak = set(rng.sample(SCENARIOS, 3))
        base = rng.choice([0.1, 0.2, 0.3])
        history = []
        for _ in range(simulations):
            scenario = rng.choice(SCENARIOS)
            probability = base + (0.4 if scenario in weak else 0.0)
            clicked = rng.random() < probability
            row = build_feature_row(history, scenario)
            row["current_clicked"] = int(clicked)
            rows.append(row)
            history.append(sim(scenario, clicked=clicked, reported=(not clicked and rng.random() < 0.5)))
    return rows


def add_history(db, models, employee_id, campaign_id, records, start=None):
    """Insert simulation records into the test database with increasing timestamps."""
    start = start or datetime.utcnow() - timedelta(days=60)
    created = []
    for index, (phishing_type, clicked, reported) in enumerate(records):
        simulation = models.Simulation(
            employee_id=employee_id,
            campaign_id=campaign_id,
            email_subject=f"[SYNTHETIC TEST] {phishing_type}",
            phishing_type=phishing_type,
            status="clicked" if clicked else ("reported" if reported else "sent"),
            clicked=clicked,
            reported=reported,
            created_at=start + timedelta(minutes=index),
        )
        db.add(simulation)
        created.append(simulation)
    db.commit()
    return created
