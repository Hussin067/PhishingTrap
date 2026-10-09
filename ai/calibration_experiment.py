"""
Calibration experiment on SYNTHETIC data.

Question: which Random Forest configuration gives predict_proba values that
are closest to the observed click frequencies? (A model can rank well and
still output badly scaled probabilities.)

Variants compared, on the same two splits as evaluate_splits.py:
  A. balanced           - current configuration (class_weight="balanced")
  B. unweighted         - no class_weight
  C. unweighted + leaf  - no class_weight, min_samples_leaf=10 (smoother trees)
  D. C + sigmoid calib  - C wrapped in CalibratedClassifierCV (sigmoid, cv=3)

Caveat: CalibratedClassifierCV uses plain row-wise inner CV, so rows from the
same employee can sit on both sides of the inner split. Calibration here may
therefore look slightly better than it would on truly new employees.
The data is synthetic; none of this shows real-world calibration.
"""

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ai.evaluate_splits import (
    CATEGORICAL,
    DATA_FILE,
    FEATURES,
    TARGET,
    TRAIN_FRACTION,
)


def make_pipeline(class_weight, min_samples_leaf):
    preprocessor = ColumnTransformer(
        transformers=[
            ("phishing_type", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL)
        ],
        remainder="passthrough",
    )
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight=class_weight,
        min_samples_leaf=min_samples_leaf,
        n_jobs=-1,
    )
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


VARIANTS = {
    "A. balanced (current)": lambda: make_pipeline("balanced", 1),
    "B. unweighted": lambda: make_pipeline(None, 1),
    "C. unweighted + leaf=10": lambda: make_pipeline(None, 10),
    "D. C + sigmoid calibration": lambda: CalibratedClassifierCV(
        make_pipeline(None, 10), method="sigmoid", cv=3
    ),
}


def q1_scores(data, make):
    cutoff = int(TRAIN_FRACTION * (data["total_simulations"].max() + 1))
    train = data[data["total_simulations"] < cutoff]
    test = data[data["total_simulations"] >= cutoff]
    estimator = make()
    estimator.fit(train[FEATURES], train[TARGET])
    return test[TARGET].to_numpy(), estimator.predict_proba(test[FEATURES])[:, 1]


def q2_scores(data, make):
    scores = np.zeros(len(data))
    for train_idx, test_idx in GroupKFold(n_splits=4).split(
        data, groups=data["employee_id"]
    ):
        estimator = make()
        estimator.fit(data.iloc[train_idx][FEATURES], data.iloc[train_idx][TARGET])
        scores[test_idx] = estimator.predict_proba(data.iloc[test_idx][FEATURES])[:, 1]
    return data[TARGET].to_numpy(), scores


def reliability_table(y_true, scores, bins=5):
    """Mean predicted probability vs observed click rate in score quantile bins."""
    frame = pd.DataFrame({"p": scores, "y": y_true})
    frame["bin"] = pd.qcut(frame["p"], q=bins, duplicates="drop")
    table = frame.groupby("bin", observed=True).agg(
        n=("y", "size"), predicted=("p", "mean"), observed=("y", "mean")
    )
    return table.round(3)


def main():
    data = pd.read_csv(DATA_FILE)
    print(f"Rows: {len(data)}  overall click rate: {data[TARGET].mean():.3f}")
    print("SYNTHETIC DATA: results do not show real-world calibration.")
    print("Constant-rate Brier reference is printed per split; lower Brier is better.")

    for split_name, scorer in (("Q1 known employees", q1_scores), ("Q2 unseen employees", q2_scores)):
        print(f"\n=== {split_name} ===")
        reference = None
        for name, make in VARIANTS.items():
            y_true, scores = scorer(data, make)
            if reference is None:
                reference = brier_score_loss(y_true, np.full(len(y_true), y_true.mean()))
                print(f"  constant-rate Brier = {reference:.3f}")
            print(
                f"  {name:<28} AUC={roc_auc_score(y_true, scores):.3f}  "
                f"Brier={brier_score_loss(y_true, scores):.3f}  "
                f"mean predicted={scores.mean():.3f}  observed={y_true.mean():.3f}"
            )
            if name.startswith(("A.", "D.")):
                print("    reliability (score quintiles):")
                print("    " + reliability_table(y_true, scores).to_string().replace("\n", "\n    "))

    # Feature importance of variant C fitted on the Q1 training period.
    cutoff = int(TRAIN_FRACTION * (data["total_simulations"].max() + 1))
    train = data[data["total_simulations"] < cutoff]
    pipeline = make_pipeline(None, 10).fit(train[FEATURES], train[TARGET])
    names = pipeline.named_steps["preprocessor"].get_feature_names_out()
    importances = pipeline.named_steps["model"].feature_importances_
    ranked = sorted(zip(names, importances), key=lambda item: -item[1])
    print("\nTop feature importances (variant C, Q1 training period):")
    for name, value in ranked[:10]:
        print(f"  {value:.3f}  {name}")


if __name__ == "__main__":
    main()
