import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


DATA_FILE = "ai/data/employee_behavior_features.csv"

MODEL_FILE = "ai/models/phishing_behavior_model.pkl"


def evaluate_model():


    dataset = pd.read_csv(DATA_FILE)

   
    feature_columns = [
        "phishing_type",
        "total_simulations",
        "total_clicks",
        "total_reports",
        "total_ignored",
        "click_rate",
        "report_rate",
        "ignore_rate",
        "recent_failures",
        "scenario_attempts",
        "scenario_clicks",
        "scenario_click_rate",
    ]

    target_column = "current_clicked"

    X = dataset[feature_columns]

    y = dataset[target_column]

  
    model = joblib.load(MODEL_FILE)

    print("Model loaded successfully.")

    
    from sklearn.model_selection import train_test_split

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

  
    predictions = model.predict(X_test)

  
    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print()

    print(f"Test samples: {len(X_test)}")

    print(
        f"Accuracy: {accuracy:.4f}"
    )

    print()
    print("Classification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Did not click",
                "Clicked",
            ],
        )
    )

    print("Confusion Matrix:")

    matrix = confusion_matrix(
        y_test,
        predictions,
    )

    print(matrix)


if __name__ == "__main__":
    evaluate_model()