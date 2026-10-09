"""
Behavioural feature calculation. Pure functions, no database access.

The same code is used by:
  * ai/feature_engineering.py  (offline: builds the training CSV), and
  * the backend behaviour service (online: builds features for one employee).

Using one implementation avoids train/serve skew: the model always sees
features computed exactly the way it was trained.

Every function receives ONLY the simulations that happened BEFORE the one being
predicted, in chronological order. Passing the current or a later simulation
would leak the target. `history` items need three attributes:
phishing_type (str), clicked (bool), reported (bool).
"""

from typing import Sequence

RECENT_WINDOW = 5


def _count(history, predicate) -> int:
    return sum(1 for item in history if predicate(item))


def overall_features(history: Sequence) -> dict:
    """Overall behaviour across all previous simulations."""
    total = len(history)

    if total == 0:
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

    clicks = _count(history, lambda s: s.clicked)
    reports = _count(history, lambda s: s.reported)
    # "Ignored" = neither clicked nor reported. Counting it directly (instead
    # of total - clicks - reports) keeps it non-negative if a simulation was
    # both clicked and later reported.
    ignored = _count(history, lambda s: not s.clicked and not s.reported)

    recent = history[-RECENT_WINDOW:]
    recent_clicks = _count(recent, lambda s: s.clicked)
    recent_reports = _count(recent, lambda s: s.reported)

    return {
        "total_simulations": total,
        "total_clicks": clicks,
        "total_reports": reports,
        "total_ignored": ignored,
        "click_rate": round(clicks / total, 4),
        "report_rate": round(reports / total, 4),
        "ignore_rate": round(ignored / total, 4),
        "recent_failures": recent_clicks,
        "recent_click_rate": round(recent_clicks / len(recent), 4),
        "recent_report_rate": round(recent_reports / len(recent), 4),
    }


def scenario_features(history: Sequence, scenario: str) -> dict:
    """Behaviour in previous simulations of one phishing scenario."""
    same = [s for s in history if s.phishing_type == scenario]
    attempts = len(same)

    clicks = _count(same, lambda s: s.clicked)
    reports = _count(same, lambda s: s.reported)
    ignored = _count(same, lambda s: not s.clicked and not s.reported)

    if attempts == 0:
        click_rate = report_rate = ignore_rate = 0.0
    else:
        click_rate = clicks / attempts
        report_rate = reports / attempts
        ignore_rate = ignored / attempts

    return {
        "scenario_attempts": attempts,
        "scenario_clicks": clicks,
        "scenario_reports": reports,
        "scenario_ignored": ignored,
        "scenario_click_rate": round(click_rate, 4),
        "scenario_report_rate": round(report_rate, 4),
        "scenario_ignore_rate": round(ignore_rate, 4),
    }


def build_feature_row(history: Sequence, scenario: str) -> dict:
    """All model features for 'this employee, about to receive this scenario'."""
    return {
        "phishing_type": scenario,
        **overall_features(history),
        **scenario_features(history, scenario),
    }
