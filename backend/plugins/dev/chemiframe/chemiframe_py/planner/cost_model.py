from typing import Any, Dict


def score(route: Dict[str, Any]) -> float:
    steps = route.get("steps", [])
    return round(len(steps) * 1.0, 3)