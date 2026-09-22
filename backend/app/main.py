from fastapi import Depends, FastAPI , HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database.connection import get_db
import sqlalchemy
from database import models
from backend.app.templates.template_renderer import render_phishing_template
from database.schemas import (TrainingQuestionCreate , TrainingQuestionResponse , TrainingSubmit , LoginRequest , LoginResponse)
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from app.security import verify_password\



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Phishing Trap AI is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }

@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {
        "database": result
    }



@app.post("/employees")
def create_employee(
    name:str,
    email:str,
    department:str,
    db: Session = Depends(get_db)
):
 employee = models.Employee(
    name=name,
    email=email,
    department=department
)
 db.add(employee)
 db.commit()
 db.refresh(employee)
 return {
    "id": employee.id,
    "name":employee.name,
    "email":employee.email,
    "department":employee.department
}

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()

    result = []

    for employee in employees:
        result.append({
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "department": employee.department,
            "created_at":employee.created_at
        })

    return result

@app.get("/employees/{employee_id}")
def get_employee(employee_id: int , db:Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if employee is None:
        return {"Error": "Employee not found"}

    else:
        return {
            "id":employee.id,
            "name":employee.name,
            "email":employee.email,
            "department":employee.department,
            "created_at":employee.created_at
        }

@app.get("/employees/{employee_id}/trainings")
def get_employee_trainings(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if employee is None:
        return {"error": "Employee Not Found"}

    trainings = db.query(models.Training).filter(
        models.Training.employee_id == employee_id
    ).all()

    return [
        {
            "id": training.id,
            "employee_id": training.employee_id,
            "simulation_id": training.simulation_id,
            "title": training.title,
            "content": training.content,
            "category": training.category,
            "difficulty": training.difficulty,
            "score": training.score,
            "completed": training.completed,
            "completed_at": training.completed_at,
            "created_at": training.created_at
        }
        for training in trainings
    ]
@app.get("/employees/{employee_id}/trainings/completed")
def get_completed_trainings(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if employee is None:
        return {"error": "Employee Not Found"}

    trainings = db.query(models.Training).filter(
        models.Training.employee_id == employee_id,
        models.Training.completed == True
    ).all()

    return [
        {
            "id": training.id,
            "employee_id": training.employee_id,
            "simulation_id": training.simulation_id,
            "title": training.title,
            "content": training.content,
            "category": training.category,
            "difficulty": training.difficulty,
            "score": training.score,
            "completed": training.completed,
            "completed_at": training.completed_at,
            "created_at": training.created_at
        }
        for training in trainings
    ]
@app.get("/employees/{employee_id}/risk")
def get_employee_risk(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if employee is None:
        return {"error": "Employee Not Found"}

    simulations = db.query(models.Simulation).filter(
        models.Simulation.employee_id == employee_id
    ).all()

    total_simulations = len(simulations)

    if total_simulations == 0:
        return {
            "employee_id": employee_id,
            "employee_name": employee.name,
            "total_simulations": 0,
            "clicked_simulations": 0,
            "reported_simulations": 0,
            "click_rate": 0,
            "risk_score": 0,
            "risk_level": "low",
            "recommended_action": "start_baseline_simulation",
            "recommended_template": "account_verification",
            "training_required": False
        }

    clicked_simulations = sum(
        1 for simulation in simulations
        if simulation.clicked
    )

    reported_simulations = sum(
        1 for simulation in simulations
        if simulation.reported
    )

    click_rate = clicked_simulations / total_simulations

    risk_score = click_rate * 100

    if risk_score < 30:
        risk_level = "low"
        recommended_action = "continue_normal_simulations"
        recommended_template = "account_verification"
        training_required = False

    elif risk_score < 60:
        risk_level = "medium"
        recommended_action = "increase_simulation_difficulty"
        recommended_template = "mfa_verification"
        training_required = False

    else:
        risk_level = "high"
        recommended_action = "assign_security_awareness_training"
        recommended_template = "security_alert"
        training_required = True

    return {
        "employee_id": employee_id,
        "employee_name": employee.name,
        "total_simulations": total_simulations,
        "clicked_simulations": clicked_simulations,
        "reported_simulations": reported_simulations,
        "click_rate": round(click_rate * 100, 2),
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "recommended_action": recommended_action,
        "recommended_template": recommended_template,
        "training_required": training_required
    }

@app.post("/campaigns")
def create_campaign(
    name: str,
    description:str,
    db: Session = Depends(get_db)
):
    campaign = models.Campaign(
        name = name,
        description = description
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return {
        "id":campaign.id,
        "name":campaign.name,
        "description":campaign.description,
        "created_at":campaign.created_at
    }

@app.get("/campaigns/{campaign_id}")
def get_campaings(campaign_id: int , db:Session = Depends(get_db)):
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id
    ).first()
    if campaign is None:
       return {"error": "Campaign Not Found"}

    return {
    "id": campaign.id,
    "name": campaign.name,
    "description": campaign.description,
    "created_at": campaign.created_at
}
@app.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(models.Campaign).all()

    result = []

    for campaign in campaigns:
        result.append({
            "id": campaign.id,
            "name": campaign.name,
            "description": campaign.description,
            "created_at": campaign.created_at
        })

    return result

@app.post("/simulations")
def create_simulation(
    employee_id: int,
    campaign_id: int,
    email_subject: str,
    phishing_type: str,
    db: Session = Depends(get_db)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if employee is None:
        return {"error": "Employee Not Found"}

    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id
    ).first()

    if campaign is None:
        return {"error": "Campaign Not Found"}

    simulation = models.Simulation(
        employee_id=employee_id,
        campaign_id=campaign_id,
        email_subject=email_subject,
        phishing_type=phishing_type
    )

    db.add(simulation)
    db.commit()
    db.refresh(simulation)

    return {
        "id": simulation.id,
        "employee_id": simulation.employee_id,
        "campaign_id": simulation.campaign_id,
        "email_subject": simulation.email_subject,
        "phishing_type": simulation.phishing_type,
        "status": simulation.status,
        "clicked": simulation.clicked,
        "reported": simulation.reported,
        "created_at": simulation.created_at
    }
@app.post("/simulations/{simulation_id}/generate")
def generate_simulation_email(
    simulation_id: int,
    db: Session = Depends(get_db)
):
    simulation = db.query(models.Simulation).filter(
        models.Simulation.id == simulation_id
    ).first()

    if simulation is None:
        return {"error": "Simulation Not Found"}

    employee = db.query(models.Employee).filter(
        models.Employee.id == simulation.employee_id
    ).first()

    if employee is None:
        return {"error": "Employee Not Found"}

    phishing_link = (
        f"http://localhost:8000/simulations/click/{simulation.id}"
    )

    generated_email = render_phishing_template(
        template_name=simulation.phishing_type,
        employee_name=employee.name,
        phishing_link=phishing_link
    )

    if generated_email is None:
        return {"error": "Phishing Template Not Found"}

    return {
        "simulation_id": simulation.id,
        "employee_id": employee.id,
        "employee_name": employee.name,
        "email": generated_email
    }
@app.get("/simulations/{simulation_id}/preview", response_class=HTMLResponse)
def preview_simulation_email(
    simulation_id: int,
    db: Session = Depends(get_db)
):
    simulation = db.query(models.Simulation).filter(
        models.Simulation.id == simulation_id
    ).first()

    if simulation is None:
        return HTMLResponse(
            content="<h1>Simulation Not Found</h1>",
            status_code=404
        )

    employee = db.query(models.Employee).filter(
        models.Employee.id == simulation.employee_id
    ).first()

    if employee is None:
        return HTMLResponse(
            content="<h1>Employee Not Found</h1>",
            status_code=404
        )

    phishing_link = (
        f"http://localhost:8000/simulations/click/{simulation.id}"
    )

    generated_email = render_phishing_template(
        template_name=simulation.phishing_type,
        employee_name=employee.name,
        phishing_link=phishing_link
    )

    if generated_email is None:
        return HTMLResponse(
            content="<h1>Phishing Template Not Found</h1>",
            status_code=404
        )

    return HTMLResponse(
        content=generated_email["html_body"]
    )
@app.get("/simulations/click/{simulation_id}")
def track_simulation_click(
    simulation_id: int,
    db: Session = Depends(get_db)
):
    simulation = db.query(models.Simulation).filter(
        models.Simulation.id == simulation_id
    ).first()

    if simulation is None:
        return {"error": "Simulation Not Found"}

    simulation.clicked = True
    simulation.status = "clicked"

    event = models.Event(
        simulation_id=simulation.id,
        event_type="click",
        description="Employee clicked the simulated phishing link"
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Simulation click recorded",
        "simulation_id": simulation.id,
        "clicked": simulation.clicked,
        "status": simulation.status,
        "event_id": event.id
    }

@app.get("/simulations/{simulation_id}")
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db)
):
    simulation = db.query(models.Simulation).filter(
        models.Simulation.id == simulation_id
    ).first()

    if simulation is None:
        return {"error": "Simulation Not Found"}

    return {
        "id": simulation.id,
        "employee_id": simulation.employee_id,
        "campaign_id": simulation.campaign_id,
        "email_subject": simulation.email_subject,
        "phishing_type": simulation.phishing_type,
        "status": simulation.status,
        "clicked": simulation.clicked,
        "reported": simulation.reported,
        "created_at": simulation.created_at
    }


@app.get("/simulations")
def get_simulations(db: Session = Depends(get_db)):
    simulations = db.query(models.Simulation).all()

    result = []

    for simulation in simulations:
        result.append({
            "id": simulation.id,
            "employee_id": simulation.employee_id,
            "campaign_id": simulation.campaign_id,
            "email_subject": simulation.email_subject,
            "phishing_type": simulation.phishing_type,
            "status": simulation.status,
            "clicked": simulation.clicked,
            "reported": simulation.reported,
            "created_at": simulation.created_at
        })

    return result

@app.post("/events")
def create_event(
    simulation_id: int,
    event_type: str,
    description: str,
    db: Session = Depends(get_db)
):
    event = models.Event(
        simulation_id=simulation_id,
        event_type=event_type,
        description=description
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "id": event.id,
        "simulation_id": event.simulation_id,
        "event_type": event.event_type,
        "description": event.description,
        "created_at": event.created_at
    }

@app.get("/events/{event_id}")
def get_events(event_id:int , db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if event is None:
        return {"Error":"Event is Not Found"}

    return{"id": event.id,
            "simulation_id": event.simulation_id,
            "event_type": event.event_type,
            "description": event.description,
            "created_at": event.created_at}


@app.get("/event")
def get_events(db:Session = Depends(get_db)):
    events = db.query(models.Event).all()

    result = []

    for event in events:
        result.append({"id": event.id,
                "simulation_id": event.simulation_id,
                "event_type": event.event_type,
                "description": event.description,
                "created_at": event.created_at})

    return result

@app.post("/trainings")
def create_training(
    employee_id: int,
    title: str,
    content: str,
    simulation_id: int | None = None,
    db: Session = Depends(get_db)
):
    training = models.Training(
        employee_id=employee_id,
        simulation_id=simulation_id,
        title=title,
        content=content
    )

    db.add(training)
    db.commit()
    db.refresh(training)

    return {
        "id": training.id,
        "employee_id": training.employee_id,
        "simulation_id": training.simulation_id,
        "title": training.title,
        "content": training.content,
        "completed": training.completed,
        "completed_at": training.completed_at,
        "created_at": training.created_at
    }

@app.get("/trainings")
def get_trainings(db: Session = Depends(get_db)):
    trainings = db.query(models.Training).all()

    result = []

    for training in trainings:
        result.append({
            "id": training.id,
            "employee_id": training.employee_id,
            "simulation_id": training.simulation_id,
            "title": training.title,
            "content": training.content,
            "completed": training.completed,
            "completed_at": training.completed_at,
            "created_at": training.created_at
        })

    return result


@app.get("/trainings/{training_id}")
def get_training(
    training_id: int,
    db: Session = Depends(get_db)
):
    training = db.query(models.Training).filter(
        models.Training.id == training_id
    ).first()

    if training is None:
        return {"error": "Training Not Found"}

    return {
    "id": training.id,
    "employee_id": training.employee_id,
    "simulation_id": training.simulation_id,
    "title": training.title,
    "content": training.content,
    "category": training.category,
    "difficulty": training.difficulty,
    "score": training.score,
    "completed": training.completed,
    "completed_at": training.completed_at,
    "created_at": training.created_at
}
@app.post("/trainings/{training_id}/questions", response_model=TrainingQuestionResponse)
def create_training_question(
    training_id: int,
    question_data: TrainingQuestionCreate,
    db: Session = Depends(get_db)
):
    training = db.query(models.Training).filter(
        models.Training.id == training_id
    ).first()

    if training is None:
        return {"error": "Training Not Found"}

    question = models.TrainingQuestion(
        training_id=training_id,
        question=question_data.question,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question
@app.get("/trainings/{training_id}/questions", response_model=list[TrainingQuestionResponse])
def get_training_questions(
    training_id: int,
    db: Session = Depends(get_db)
):
    training = db.query(models.Training).filter(
        models.Training.id == training_id
    ).first()

    if training is None:
        return {"error": "Training Not Found"}

    questions = db.query(models.TrainingQuestion).filter(
        models.TrainingQuestion.training_id == training_id
    ).all()

    return questions

@app.post("/trainings/{training_id}/submit")
def submit_training(
    training_id: int,
    submission: TrainingSubmit,
    db: Session = Depends(get_db)
):
    training = db.query(models.Training).filter(
        models.Training.id == training_id
    ).first()

    if training is None:
        return {"error": "Training Not Found"}

    questions = db.query(models.TrainingQuestion).filter(
        models.TrainingQuestion.training_id == training_id
    ).all()

    if len(questions) == 0:
        return {"error": "No Questions Found"}

    correct_answers = 0

    for question in questions:
        employee_answer = submission.answers.get(question.id)

        if employee_answer == question.correct_answer:
            correct_answers += 1

    score = round(
        (correct_answers / len(questions)) * 100
    )

    training.score = score
    training.completed = True
    training.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(training)

    passed = score >= 80

    return {
        "training_id": training.id,
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": len(questions),
        "passed": passed,
        "completed": training.completed,
        "completed_at": training.completed_at
    }

@app.post("/auth/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    email = login_data.email.strip().lower()

    employee = (
        db.query(models.Employee)
        .filter(sqlalchemy.func.lower(models.Employee.email) == email)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=403,
            detail="This employee account is inactive"
        )

    if employee.password_hash is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(login_data.password, employee.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
    }