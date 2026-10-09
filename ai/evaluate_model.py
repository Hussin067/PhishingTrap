"""
The original version of this script evaluated the saved model on a random
80/20 row split. That was misleading: rows from the same employee appeared on
both sides, and the saved model is now trained on all rows, so any test on the
same CSV would be evaluating on training data.

Evaluation now lives in ai/evaluate_splits.py (chronological split for known
employees, GroupKFold for unseen employees, with baselines and a ceiling).
This file simply runs it so the old command keeps working.

Run from the project root:  python -m ai.evaluate_model
"""

from ai.evaluate_splits import main

if __name__ == "__main__":
    main()
