from typing import Any, Dict


def estimate_complexity(route: Dict[str, Any]) -> float:
    return float(len(route.get("steps", [])))