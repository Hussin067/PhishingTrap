import random

from database.connection import SessionLocal
from database.models import Employee, Campaign, Simulation, Event



CAMPAIGN_NAME = "ML Synthetic Training Dataset v1"

SIMULATIONS_PER_EMPLOYEE = 200

RANDOM_SEED = 42

random.seed(RANDOM_SEED)



PHISHING_TYPES = [
    "password_reset",
    "account_verification",
    "invoice",
    "security_alert",
    "payment_request",
    "shipping_notification",
    "order_confirmation",
    "mfa_verification",
    "document_shared",
    "payroll_update",
    "hr_document",
    "benefits_update",
]




EMPLOYEE_PROFILES = {

  
    1: {
        "baseline": 0.20,
        "vulnerable": {
            "password_reset": 0.05,
            "hr_document": 0.45,
            "document_shared": 0.35,
            "payroll_update": 0.30,
        },
    },

    
    2: {
        "baseline": 0.15,
        "vulnerable": {
            "invoice": 0.45,
            "payment_request": 0.40,
            "order_confirmation": 0.30,
            "benefits_update": 0.10,
        },
    },

    
    3: {
        "baseline": 0.20,
        "vulnerable": {
            "security_alert": 0.45,
            "mfa_verification": 0.40,
            "account_verification": 0.25,
            "password_reset": 0.10,
        },
    },

    
    4: {
        "baseline": 0.15,
        "vulnerable": {
            "hr_document": 0.45,
            "payroll_update": 0.40,
            "benefits_update": 0.35,
            "document_shared": 0.20,
        },
    },

   
    5: {
        "baseline": 0.15,
        "vulnerable": {
            "shipping_notification": 0.45,
            "order_confirmation": 0.40,
            "invoice": 0.20,
        },
    },

    
    6: {
        "baseline": 0.20,
        "vulnerable": {
            "payment_request": 0.45,
            "invoice": 0.40,
            "order_confirmation": 0.30,
            "payroll_update": 0.15,
        },
    },

  
    7: {
        "baseline": 0.10,
        "vulnerable": {
            "password_reset": 0.45,
            "mfa_verification": 0.40,
            "account_verification": 0.35,
            "security_alert": 0.15,
        },
    },

    
    8: {
        "baseline": 0.20,
        "vulnerable": {
            "invoice": 0.45,
            "payroll_update": 0.40,
            "benefits_update": 0.35,
            "payment_request": 0.30,
        },
    },

   
    9: {
        "baseline": 0.15,
        "vulnerable": {
            "hr_document": 0.50,
            "document_shared": 0.40,
            "payroll_update": 0.30,
            "benefits_update": 0.25,
        },
    },

   
    10: {
        "baseline": 0.20,
        "vulnerable": {
            "document_shared": 0.45,
            "shipping_notification": 0.40,
            "order_confirmation": 0.30,
            "invoice": 0.15,
        },
    },

   
    11: {
        "baseline": 0.15,
        "vulnerable": {
            "payroll_update": 0.50,
            "benefits_update": 0.45,
            "hr_document": 0.30,
            "invoice": 0.15,
        },
    },

    
    12: {
        "baseline": 0.10,
        "vulnerable": {
            "security_alert": 0.45,
            "account_verification": 0.40,
            "mfa_verification": 0.35,
            "password_reset": 0.20,
        },
    },
}



def generate_phishing_types():

    # Whole cycles of all 12 scenarios, then a random remainder, so the
    # list always has exactly SIMULATIONS_PER_EMPLOYEE items.
    full_cycles, remainder = divmod(
        SIMULATIONS_PER_EMPLOYEE,
        len(PHISHING_TYPES),
    )

    scenarios = PHISHING_TYPES * full_cycles

    scenarios.extend(
        random.sample(
            PHISHING_TYPES,
            remainder,
        )
    )

    random.shuffle(scenarios)

    return scenarios




def calculate_click_probability(
    employee_id,
    phishing_type,
):
    profile = EMPLOYEE_PROFILES.get(
        employee_id,
        {
            "baseline": 0.30,
            "vulnerable": {},
        },
    )

    probability = profile["baseline"]

    probability += profile["vulnerable"].get(
        phishing_type,
        0.0,
    )

   
    probability = max(
        0.05,
        min(probability, 0.85),
    )

    return probability


def generate_employee_data(
    db,
    employee,
    campaign,
):
    scenarios = generate_phishing_types()

    for phishing_type in scenarios:

        click_probability = calculate_click_probability(
            employee.id,
            phishing_type,
        )

        random_value = random.random()

        clicked = (
            random_value < click_probability
        )

       
        reported = False

        if not clicked:

            report_probability = 0.20 + (
                1.0 - click_probability
            ) * 0.45

            reported = (
                random.random()
                < report_probability
            )

        if clicked:
            status = "clicked"

        elif reported:
            status = "reported"

        else:
            status = "sent"

        simulation = Simulation(
            employee_id=employee.id,
            campaign_id=campaign.id,
            email_subject=(
                f"Security notification - "
                f"{phishing_type.replace('_', ' ').title()}"
            ),
            phishing_type=phishing_type,
            status=status,
            clicked=clicked,
            reported=reported,
        )

        db.add(simulation)

        
        db.flush()

       
        if clicked:

            event = Event(
                simulation_id=simulation.id,
                event_type="click",
                description=(
                    "Employee clicked the simulated "
                    "phishing link."
                ),
            )

            db.add(event)

        # Record report event
        elif reported:

            event = Event(
                simulation_id=simulation.id,
                event_type="report",
                description=(
                    "Employee reported the "
                    "simulated phishing email."
                ),
            )

            db.add(event)




def clear_existing_synthetic_data(
    db,
    campaign,
):

    simulations = (
        db.query(Simulation)
        .filter(
            Simulation.campaign_id == campaign.id
        )
        .all()
    )

    deleted_events = 0

    for simulation in simulations:

        events = (
            db.query(Event)
            .filter(
                Event.simulation_id
                == simulation.id
            )
            .all()
        )

        for event in events:
            db.delete(event)
            deleted_events += 1

        db.delete(simulation)

    db.flush()

    print(
        f"Removed {len(simulations)} "
        f"old synthetic simulations."
    )

    print(
        f"Removed {deleted_events} "
        f"old synthetic events."
    )



def generate_training_data():

    db = SessionLocal()

    try:

       
        campaign = (
            db.query(Campaign)
            .filter(
                Campaign.name
                == CAMPAIGN_NAME
            )
            .first()
        )

        if not campaign:

            campaign = Campaign(
                name=CAMPAIGN_NAME,
                description=(
                    "Synthetic dataset for training "
                    "the Phishing Trap AI behavioral "
                    "prediction model."
                ),
            )

            db.add(campaign)

            db.flush()

            print(
                f"Created campaign: "
                f"{CAMPAIGN_NAME}"
            )

        else:

            print(
                f"Using campaign: "
                f"{CAMPAIGN_NAME}"
            )

        
        clear_existing_synthetic_data(
            db,
            campaign,
        )

       
        employees = (
            db.query(Employee)
            .filter(
                Employee.is_active == True
            )
            .order_by(Employee.id)
            .all()
        )

        print(
            f"Found {len(employees)} "
            f"active employees."
        )

        total_simulations = 0

       
        for employee in employees:

            print(
                f"Generating data for "
                f"{employee.name}..."
            )

            generate_employee_data(
                db,
                employee,
                campaign,
            )

            total_simulations += (
                SIMULATIONS_PER_EMPLOYEE
            )

        db.commit()

        print()
        print(
            "Synthetic training data "
            "generated successfully!"
        )

        print(
            f"Employees: {len(employees)}"
        )

        print(
            f"Simulations: "
            f"{total_simulations}"
        )

    except Exception as error:

        db.rollback()

        print(
            "Error generating "
            "synthetic data:"
        )

        print(error)

    finally:

        db.close()




if __name__ == "__main__":
    generate_training_data()