from typing import Any, Dict


def get_detectability_threshold(intent: Dict[str, Any]) -> float:
    constraints = intent.get("constraints", {})
    return float(constraints.get("min_detectability_score", 0.90))


def get_max_steps(intent: Dict[str, Any]) -> int:
    constraints = intent.get("constraints", {})
    return int(constraints.get("max_steps", 10))