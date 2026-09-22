from datetime import datetime
from pydantic import BaseModel

class TrainingQuestionCreate(BaseModel):
    question:str
    options:list[str]
    correct_answer:str
    explanation:str

class TrainingQuestionResponse(BaseModel):
    id:int
    training_id:int
    question:str
    options:list[str]
    explanation:str
    created_at:datetime

class TrainingResponse(BaseModel):
    id:int
    employee_id:int
    simulation_id:int | None
    title: str
    content:str
    category:str
    difficulty:str
    score:int | None
    completed:bool
    completed_at : datetime | None
    created_at : datetime

class TrainingSubmit(BaseModel):
    answers: dict[int , str]

class LoginRequest(BaseModel):
    email:str
    password:str

class LoginResponse(BaseModel):
    id:int
    name:str
    email:str
    department:str | None