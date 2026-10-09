import csv
import os

from database.connection import SessionLocal
from database.models import Employee, Campaign, Simulation


OUTPUT_FILE = "ai/data/employee_behavior_features.csv"

CAMPAIGN_NAME = "ML Synthetic Training Dataset v1"


def calculate_features(simulations, current_index):
    """
    Calculate overall employee behavior using only
    simulations that happened before the current simulation.
    """

    previous_simulations = simulations[:current_index]

    total_simulations = len(previous_simulations)

    if total_simulations == 0:
        return {
            "total_simulations": 0,
            "total_clicks": 0,
            "total_reports": 0,
            "total_ignored": 0,
            "click_rate": 0.0,
            "report_rate": 0.0,
            "ignore_rate": 0.0,
            "recent_failures": 0,
            "recent_click_rate": 0.0,
            "recent_report_rate": 0.0,
        }

    total_clicks = sum(
        1
        for simulation in previous_simulations
        if simulation.clicked
    )

    total_reports = sum(
        1
        for simulation in previous_simulations
        if simulation.reported
    )

    total_ignored = (
        total_simulations
        - total_clicks
        - total_reports
    )

    click_rate = (
        total_clicks / total_simulations
    )

    report_rate = (
        total_reports / total_simulations
    )

    ignore_rate = (
        total_ignored / total_simulations
    )

    # ----------------------------------------------
    # Recent behavior
    # ----------------------------------------------

    recent_simulations = previous_simulations[-5:]

    recent_count = len(recent_simulations)

    recent_clicks = sum(
        1
        for simulation in recent_simulations
        if simulation.clicked
    )

    recent_reports = sum(
        1
        for simulation in recent_simulations
        if simulation.reported
    )

    if recent_count > 0:

        recent_click_rate = (
            recent_clicks / recent_count
        )

        recent_report_rate = (
            recent_reports / recent_count
        )

    else:

        recent_click_rate = 0.0
        recent_report_rate = 0.0

    # ----------------------------------------------
    # Recent failures
    # ----------------------------------------------

    recent_failures = recent_clicks

    return {
        "total_simulations": total_simulations,
        "total_clicks": total_clicks,
        "total_reports": total_reports,
        "total_ignored": total_ignored,
        "click_rate": round(click_rate, 4),
        "report_rate": round(report_rate, 4),
        "ignore_rate": round(ignore_rate, 4),
        "recent_failures": recent_failures,
        "recent_click_rate": round(
            recent_click_rate,
            4
        ),
        "recent_report_rate": round(
            recent_report_rate,
            4
        ),
    }


def calculate_scenario_features(
    simulations,
    current_index,
    current_phishing_type
):
    """
    Calculate employee behavior for the current
    phishing scenario using only previous simulations.
    """

    previous_simulations = simulations[:current_index]

    scenario_simulations = [
        simulation
        for simulation in previous_simulations
        if simulation.phishing_type
        == current_phishing_type
    ]

    scenario_attempts = len(
        scenario_simulations
    )

    scenario_clicks = sum(
        1
        for simulation in scenario_simulations
        if simulation.clicked
    )

    scenario_reports = sum(
        1
        for simulation in scenario_simulations
        if simulation.reported
    )

    scenario_ignored = (
        scenario_attempts
        - scenario_clicks
        - scenario_reports
    )

    # ----------------------------------------------
    # Scenario click rate
    # ----------------------------------------------

    if scenario_attempts > 0:

        scenario_click_rate = (
            scenario_clicks
            / scenario_attempts
        )

        scenario_report_rate = (
            scenario_reports
            / scenario_attempts
        )

        scenario_ignore_rate = (
            scenario_ignored
            / scenario_attempts
        )

    else:

        scenario_click_rate = 0.0
        scenario_report_rate = 0.0
        scenario_ignore_rate = 0.0

    return {
        "scenario_attempts": scenario_attempts,
        "scenario_clicks": scenario_clicks,
        "scenario_reports": scenario_reports,
        "scenario_ignored": scenario_ignored,
        "scenario_click_rate": round(
            scenario_click_rate,
            4
        ),
        "scenario_report_rate": round(
            scenario_report_rate,
            4
        ),
        "scenario_ignore_rate": round(
            scenario_ignore_rate,
            4
        ),
    }


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
                    Simulation.created_at
                )
                .all()
            )

            # --------------------------------------
            # Process every simulation
            # --------------------------------------

            for index, simulation in enumerate(
                simulations
            ):

                behavior_features = (
                    calculate_features(
                        simulations,
                        index
                    )
                )

                scenario_features = (
                    calculate_scenario_features(
                        simulations,
                        index,
                        simulation.phishing_type
                    )
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

                    **scenario_features,

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