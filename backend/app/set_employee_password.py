from database.connection import SessionLocal
from database import models
from app.security import hash_password


EMAIL = "Hussin100@gmail.com"
PASSWORD = "TestPassword123"


db = SessionLocal()

try:
    employee = (
        db.query(models.Employee)
        .filter(models.Employee.email == EMAIL)
        .first()
    )

    if employee is None:
        print("Employee not found.")
    else:
        employee.password_hash = hash_password(PASSWORD)
        db.commit()

        print(f"Password set successfully for {employee.email}")

finally:
    db.close()