from typing import Any, Dict


def lower_to_sequence_ir(route: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "artifact_id": "seq_artifact_001",
        "family": route.get("family"),
        "sequence": route.get("sequence", []),
        "compiled_steps": [step.get("label") for step in route.get("steps", [])],
    }