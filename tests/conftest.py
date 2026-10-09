import json
import os

# Tests must never touch the real PostgreSQL database: force SQLite BEFORE
# database.connection is imported (load_dotenv does not override existing vars).
os.environ["DATABASE_URL"] = "sqlite://"

import joblib
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ai.model_config import FEATURES, TARGET, build_pipeline
from ai.prediction_service import ClickPredictor, get_predictor
from database import models
from database.connection import Base, get_db
from tests.synthetic import training_rows


@pytest.fixture(scope="session")
def trained_model_files(tmp_path_factory):
    """Train a small model on SYNTHETIC rows into a temp dir (independent of the saved model)."""
    directory = tmp_path_factory.mktemp("model")
    model_path = directory / "model.pkl"
    metadata_path = directory / "model.json"

    frame = pd.DataFrame(training_rows())
    pipeline = build_pipeline().fit(frame[FEATURES], frame[TARGET])
    joblib.dump(pipeline, model_path)
    metadata_path.write_text(
        json.dumps(
            {
                "model_version": "test-synthetic",
                "features": FEATURES,
                "status": "experimental",
                "data_source": "SYNTHETIC test fixture",
            }
        ),
        encoding="utf-8",
    )
    return str(model_path), str(metadata_path)


@pytest.fixture(scope="session")
def predictor(trained_model_files):
    model_path, metadata_path = trained_model_files
    return ClickPredictor(model_path, metadata_path)


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autocommit=False, autoflush=False)
    engine.dispose()


@pytest.fixture()
def db(session_factory):
    session = session_factory()
    yield session
    session.close()


@pytest.fixture()
def client(session_factory, predictor):
    from backend.app.main import app

    def override_get_db():
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_predictor] = lambda: predictor
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def employee(db):
    row = models.Employee(name="Test Employee", email="test.employee@example.test", department="QA")
    db.add(row)
    db.commit()
    return row


@pytest.fixture()
def awareness_campaign(db):
    row = models.Campaign(name="Q1 Awareness (SYNTHETIC test)", description="test")
    db.add(row)
    db.commit()
    return row


@pytest.fixture()
def synthetic_campaign(db):
    row = models.Campaign(name="ML Synthetic Training Dataset v1", description="test")
    db.add(row)
    db.commit()
    return row
