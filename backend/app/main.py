from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from database.connection import get_db
from sqlalchemy import text
from database import models

app = FastAPI()

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
        "completed": training.completed,
        "completed_at": training.completed_at,
        "created_at": training.created_at
    }



