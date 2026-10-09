import csv
import os

from database.connection import SessionLocal
from ai.features import overall_features, scenario_features
from database.models import Employee, Campaign, Simulation


OUTPUT_FILE = "ai/data/employee_behavior_features.csv"

CAMPAIGN_NAME = "ML Synthetic Training Dataset v1"


def generate_feature_dataset():

    db = SessionLocal()

    try:

        # ------------------------------------------
        # Find synthetic campaign
        # ------------------------------------------

        campaign = (
            db.query(Campaign)
            .filter(
                Campaign.name
                == CAMPAIGN_NAME
            )
            .first()
        )

        if not campaign:

            print(
                f"Campaign '{CAMPAIGN_NAME}' "
                "was not found."
            )

            return

        # ------------------------------------------
        # Get active employees
        # ------------------------------------------

        employees = (
            db.query(Employee)
            .filter(
                Employee.is_active == True
            )
            .order_by(Employee.id)
            .all()
        )

        dataset = []

        # ------------------------------------------
        # Process every employee
        # ------------------------------------------

        for employee in employees:

            simulations = (
                db.query(Simulation)
                .filter(
                    Simulation.employee_id
                    == employee.id,

                    Simulation.campaign_id
                    == campaign.id
                )
                .order_by(
                    Simulation.created_at,
                    Simulation.id
                )
                .all()
            )

            # --------------------------------------
            # Process every simulation
            # --------------------------------------

            for index, simulation in enumerate(
                simulations
            ):

                # Only simulations BEFORE this one (no target leakage).
                history = simulations[:index]

                behavior_features = overall_features(history)

                scenario_feature_values = scenario_features(
                    history,
                    simulation.phishing_type
                )

                row = {

                    # --------------------------------
                    # Identity/context
                    # --------------------------------

                    "employee_id":
                        employee.id,

                    "simulation_id":
                        simulation.id,

                    "phishing_type":
                        simulation.phishing_type,

                    # --------------------------------
                    # Overall behavior
                    # --------------------------------

                    **behavior_features,

                    # --------------------------------
                    # Scenario behavior
                    # --------------------------------

                    **scenario_feature_values,

                    # --------------------------------
                    # Prediction targets
                    # --------------------------------

                    "current_clicked":
                        int(
                            simulation.clicked
                        ),

                    "current_reported":
                        int(
                            simulation.reported
                        ),
                }

                dataset.append(row)

        # ------------------------------------------
        # Check dataset
        # ------------------------------------------

        if not dataset:

            print(
                "No synthetic simulation "
                "data found."
            )

            return

        # ------------------------------------------
        # Create output directory
        # ------------------------------------------

        os.makedirs(
            os.path.dirname(OUTPUT_FILE),
            exist_ok=True
        )

        # ------------------------------------------
        # Write CSV
        # ------------------------------------------

        fieldnames = dataset[0].keys()

        with open(
            OUTPUT_FILE,
            "w",
            newline="",
            encoding="utf-8"
        ) as file:

            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames
            )

            writer.writeheader()
            writer.writerows(dataset)

        # ------------------------------------------
        # Results
        # ------------------------------------------

        print(
            "Feature dataset generated successfully!"
        )

        print(
            f"Campaign: {CAMPAIGN_NAME}"
        )

        print(
            f"Employees processed: "
            f"{len(employees)}"
        )

        print(
            f"Training rows: "
            f"{len(dataset)}"
        )

        print(
            f"Features: "
            f"{len(fieldnames)}"
        )

        print(
            f"Saved to: {OUTPUT_FILE}"
        )

    except Exception as error:

        print(
            "Error generating "
            "feature dataset:"
        )

        print(error)

    finally:

        db.close()


if __name__ == "__main__":
    generate_feature_dataset()