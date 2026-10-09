"""
Backend data access for the AI layer.

This is the ONLY place where behaviour data is read from the database for the
agent and the prediction service. The ai/ package receives plain records and
never imports SQLAlchemy.

Synthetic data policy: simulations of the synthetic training campaign are
excluded by default so that generated data is never mistaken for real employee
behaviour. Callers must opt in with include_synthetic=True (e.g. for demos).
"""

from sqlalchemy.orm import Session

from ai.model_config import SCENARIOS
from database import models

SYNTHETIC_CAMPAIGN_NAME = "ML Synthetic Training Dataset v1"
ADAPTIVE_CAMPAIGN_NAME = "AI Adaptive Simulations"


class EmployeeNotFoundError(LookupError):
    pass


class EmployeeInactiveError(RuntimeError):
    pass


def get_active_employee(db: Session, employee_id: int) -> models.Employee:
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if employee is None:
        raise EmployeeNotFoundError(f"employee {employee_id} not found")
    if not employee.is_active:
        raise EmployeeInactiveError(f"employee {employee_id} is inactive")
    return employee


def get_history(db: Session, employee_id: int, include_synthetic: bool = False) -> list:
    """Employee's simulations, oldest first. Records expose phishing_type/clicked/reported."""
    query = (
        db.query(models.Simulation)
        .join(models.Campaign, models.Simulation.campaign_id == models.Campaign.id)
        .filter(models.Simulation.employee_id == employee_id)
    )
    if not include_synthetic:
        query = query.filter(models.Campaign.name != SYNTHETIC_CAMPAIGN_NAME)
    return query.order_by(models.Simulation.created_at, models.Simulation.id).all()


def get_training_topics(db: Session, employee_id: int) -> tuple[set[str], set[str]]:
    """(completed topics, open topics) among trainings whose category is a scenario."""
    trainings = (
        db.query(models.Training).filter(models.Training.employee_id == employee_id).all()
    )
    completed = {t.category for t in trainings if t.completed and t.category in SCENARIOS}
    open_topics = {t.category for t in trainings if not t.completed and t.category in SCENARIOS}
    return completed, open_topics


def get_or_create_adaptive_campaign(db: Session) -> models.Campaign:
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.name == ADAPTIVE_CAMPAIGN_NAME).first()
    )
    if campaign is None:
        campaign = models.Campaign(
            name=ADAPTIVE_CAMPAIGN_NAME,
            description=(
                "Authorised internal simulations proposed by the adaptive agent and "
                "approved by an administrator."
            ),
        )
        db.add(campaign)
        db.flush()
    return campaign
