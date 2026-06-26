from typing import Any, Dict, List


def default_intent() -> Dict[str, Any]:
    return {
        "target_family": "aryl_coupled_scaffold",
        "target_domain": "small_molecule",
        "inputs": ["aryl_halide", "boronic_acid"],
        "constraints": {
            "max_steps": 6,
            "green_solvents_only": True,
            "min_detectability_score": 0.90,
        },
        "objectives": ["yield", "purity", "atom_economy"],
    }


def validate_intent(intent: Dict[str, Any]) -> Dict[str, Any]:
    errors: List[str] = []
    if not isinstance(intent, dict):
        errors.append("Intent must be a dictionary.")
        return {"ok": False, "errors": errors}
    if not intent.get("target_family"):
        errors.append("Missing target_family.")
    if "inputs" not in intent:
        errors.append("Missing inputs.")
    if not isinstance(intent.get("inputs", []), list):
        errors.append("inputs must be a list.")
    return {"ok": len(errors) == 0, "errors": errors}