import os
import joblib
import pandas as pd  

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder




DATA_FILE = "ai/data/employee_behavior_features.csv"

MODEL_DIRECTORY = "ai/models"

MODEL_FILE = os.path.join(
    MODEL_DIRECTORY,
    "phishing_behavior_model.pkl"
)

 

def load_dataset():
    dataset = pd.read_csv(DATA_FILE)

    print("Dataset loaded successfully.")
    print(f"Rows: {len(dataset)}")
    print(f"Columns: {len(dataset.columns)}")

    return dataset



def train_model():

    dataset = load_dataset()

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

    print()
    print("Features:")
    print(feature_columns)

    print()
    print("Target:")
    print(target_column)



    categorical_features = [
        "phishing_type"
    ]

    numerical_features = [
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


    preprocessor = ColumnTransformer(
        transformers=[
            (
                "phishing_type",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical_features,
            )
        ],
        remainder="passthrough",
    )


    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )



    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "model",
                model,
            ),
        ]
    )


    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    print()
    print(f"Training rows: {len(X_train)}")
    print(f"Testing rows: {len(X_test)}")

 

    print()
    print("Training Random Forest model...")

    pipeline.fit(
        X_train,
        y_train,
    )

    print("Model training completed.")


    os.makedirs(
        MODEL_DIRECTORY,
        exist_ok=True,
    )

    joblib.dump(
        pipeline,
        MODEL_FILE,
    )

    print()
    print("Model saved successfully.")
    print(f"Model path: {MODEL_FILE}")



if __name__ == "__main__":
    train_model()