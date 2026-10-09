"""
Adaptive decision agent (first version: deterministic and tool-driven).

What makes it agent-like: it observes an employee's history, calls tools
(statistical analysis and, when available, the ML predictor), weighs evidence
and uncertainty, chooses an action toward a goal (targeted awareness, not
punishment), explains the choice, and hands a structured PROPOSAL to the
backend. It does not learn on its own: it adapts because new outcomes recorded
by the backend change the history it observes next time.

Guardrails
  * Only scenarios from ai.model_config.SCENARIOS may be proposed.
  * No database access and no side effects: it returns a decision object; the
    backend validates and executes it.
  * Cold-start employees get a gentle baseline, never a "weakness" label.
  * A weakness needs real evidence (several attempts and repeated clicks).
  * The scenario just simulated is not repeated back-to-back.
  * A scenario with assigned-but-unfinished training is not tested yet.
  * The decision always lists its limitations.
"""

from dataclasses import dataclass, field
from typing import Iterable, Sequence

from ai.model_config import SCENARIOS
from ai.prediction_service import ClickPredictor
from ai.vulnerability import (
    EmployeeSummary,
    ScenarioAssessment,
    analyze_scenarios,
)

MIN_SCENARIO_EVIDENCE = 3  # attempts needed before calling something a weakness
MIN_SCENARIO_CLICKS = 2  # clicks needed before calling something a weakness
WEAKNESS_THRESHOLD = 0.40  # estimated click risk for a weakness
EXPLORATION_WEIGHT = 0.25  # bonus for uncertain scenarios (interval width)

EASY_ABOVE = 0.40  # smoothed overall click rate at/above which difficulty = easy
HARD_BELOW = 0.15  # ... at/below which difficulty = hard (needs >= 10 simulations)
HARD_MIN_SIMULATIONS = 10


class AgentValidationError(ValueError):
    """The agent was given invalid input (e.g. an unapproved scenario)."""


@dataclass(frozen=True)
class SimulationProposal:
    scenario: str
    difficulty: str  # easy | medium | hard (advisory label)


@dataclass(frozen=True)
class TrainingRecommendation:
    topic: str  # a scenario identifier
    priority: str  # normal | high
    reason: str
    already_assigned: bool


@dataclass(frozen=True)
class AgentDecision:
    mode: str  # cold_start | exploration | targeted
    confidence: str  # low | moderate (never "high" on this data)
    proposed_simulation: SimulationProposal
    training_recommendation: TrainingRecommendation | None
    rationale: list[str]
    limitations: list[str]
    guardrails_applied: list[str]
    employee_summary: EmployeeSummary
    assessments: list[ScenarioAssessment]
    model_used: bool
    model_version: str | None
    warnings: list[str] = field(default_factory=list)


BASE_LIMITATIONS = [
    "Estimates rest on few observations per scenario; treat them as hints, not facts.",
    "The ML model is experimental and was trained on synthetic data; it does not "
    "demonstrate real-world accuracy.",
    "Difficulty is an advisory label; the current email templates do not vary by difficulty.",
    "This is a proposal for review. It is not evidence of an employee's intent or performance.",
]


def validate_candidates(candidates: Iterable[str]) -> list[str]:
    cleaned: list[str] = []
    for scenario in candidates:
        if scenario not in SCENARIOS:
            raise AgentValidationError(f"unapproved scenario: {scenario!r}")
        if scenario not in cleaned:
            cleaned.append(scenario)
    if not cleaned:
        raise AgentValidationError("at least one candidate scenario is required")
    return cleaned


def choose_difficulty(summary: EmployeeSummary) -> str:
    if summary.cold_start:
        return "easy"
    if summary.smoothed_click_rate >= EASY_ABOVE:
        return "easy"
    if summary.smoothed_click_rate <= HARD_BELOW and summary.total_simulations >= HARD_MIN_SIMULATIONS:
        return "hard"
    return "medium"


def is_supported_weakness(assessment: ScenarioAssessment) -> bool:
    return (
        assessment.attempts >= MIN_SCENARIO_EVIDENCE
        and assessment.clicks >= MIN_SCENARIO_CLICKS
        and assessment.estimated_risk >= WEAKNESS_THRESHOLD
    )


def decide_next_action(
    history: Sequence,
    candidate_scenarios: Iterable[str],
    predictor: ClickPredictor | None = None,
    completed_training_topics: Iterable[str] = (),
    open_training_topics: Iterable[str] = (),
) -> AgentDecision:
    """
    `history`: the employee's previous simulations, chronological, supplied by
    the backend. Returns a proposal; performs no side effects.
    """
    candidates = validate_candidates(candidate_scenarios)
    completed_topics = set(completed_training_topics)
    open_topics = set(open_training_topics)

    # Tool call: statistical analysis (+ ML prediction when available).
    analysis = analyze_scenarios(history, candidates, predictor)
    summary = analysis.summary
    by_scenario = {a.scenario: a for a in analysis.assessments}

    guardrails = ["Only approved scenarios were considered."]
    rationale: list[str] = []

    # ---- Which scenarios may be proposed right now? ----
    pool = list(candidates)

    if history and len(pool) > 1 and history[-1].phishing_type in pool:
        pool.remove(history[-1].phishing_type)
        guardrails.append("Did not repeat the previous scenario back-to-back.")

    untrained_pool = [s for s in pool if s not in open_topics]
    if untrained_pool and len(untrained_pool) < len(pool):
        pool = untrained_pool
        guardrails.append(
            "Skipped scenarios with assigned training that is not yet completed."
        )

    difficulty = choose_difficulty(summary)

    # ---- Cold start: gentle baseline, no vulnerability claims ----
    if summary.cold_start:
        chosen = min(
            pool,
            key=lambda s: (by_scenario[s].attempts, candidates.index(s)),
        )
        rationale.append(
            f"Only {summary.total_simulations} previous simulation(s) exist, which is "
            "too little to judge this employee. Proposing a baseline simulation of "
            f"the least-tried scenario ('{chosen}') at easy difficulty."
        )
        guardrails.append("No weakness or training claims made during cold start.")
        return AgentDecision(
            mode="cold_start",
            confidence="low",
            proposed_simulation=SimulationProposal(chosen, "easy"),
            training_recommendation=None,
            rationale=rationale,
            limitations=BASE_LIMITATIONS,
            guardrails_applied=guardrails,
            employee_summary=summary,
            assessments=analysis.assessments,
            model_used=analysis.model_used,
            model_version=analysis.model_version,
            warnings=analysis.warnings,
        )

    # ---- Normal mode: favour likely weaknesses AND uncertain scenarios ----
    def priority(scenario: str) -> tuple[float, int]:
        a = by_scenario[scenario]
        width = a.interval_high - a.interval_low
        return (a.estimated_risk + EXPLORATION_WEIGHT * width, -candidates.index(scenario))

    chosen = max(pool, key=priority)
    chosen_assessment = by_scenario[chosen]

    if is_supported_weakness(chosen_assessment):
        mode = "targeted"
        confidence = "moderate"
        rationale.append(
            f"'{chosen}': {chosen_assessment.clicks} click(s) in "
            f"{chosen_assessment.attempts} attempts (estimated risk "
            f"{chosen_assessment.estimated_risk:.2f}). Proposing a follow-up check "
            "to see whether awareness has improved."
        )
    else:
        mode = "exploration"
        confidence = "low"
        rationale.append(
            f"'{chosen}' was chosen because its evidence is limited "
            f"({chosen_assessment.attempts} attempt(s)) or its estimated risk "
            f"({chosen_assessment.estimated_risk:.2f}) is worth monitoring. This "
            "simulation mainly gathers information."
        )

    rationale.append(
        f"Overall: {summary.total_clicks} click(s) and {summary.total_reports} "
        f"report(s) in {summary.total_simulations} simulations; difficulty set to "
        f"'{difficulty}'."
    )

    # ---- Training recommendation (supportive, evidence-based) ----
    weaknesses = sorted(
        (a for a in analysis.assessments if is_supported_weakness(a)),
        key=lambda a: -a.estimated_risk,
    )
    training = None
    if weaknesses:
        top = weaknesses[0]
        reason = (
            f"{top.clicks} click(s) in {top.attempts} '{top.scenario}' simulations "
            f"(estimated risk {top.estimated_risk:.2f})."
        )
        if top.scenario in completed_topics:
            reason += " Earlier training on this topic was completed, so this is a refresher."
        training = TrainingRecommendation(
            topic=top.scenario,
            priority="high" if top.estimated_risk >= 0.60 else "normal",
            reason=reason,
            already_assigned=top.scenario in open_topics,
        )
        rationale.append(
            f"Recommending awareness training on '{top.scenario}': {reason}"
        )
    else:
        rationale.append(
            "No scenario has enough evidence to call a weakness, so no training is recommended."
        )

    return AgentDecision(
        mode=mode,
        confidence=confidence,
        proposed_simulation=SimulationProposal(chosen, difficulty),
        training_recommendation=training,
        rationale=rationale,
        limitations=BASE_LIMITATIONS,
        guardrails_applied=guardrails,
        employee_summary=summary,
        assessments=analysis.assessments,
        model_used=analysis.model_used,
        model_version=analysis.model_version,
        warnings=analysis.warnings,
    )
