from typing import Any, Dict


def lower_to_hybrid_ir(route: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "artifact_id": "hybrid_artifact_001",
        "family": route.get("family"),
        "chemical_segment": route.get("chemical_segment", []),
        "interface_state": route.get("interface_state", {}),
        "bio_segment": route.get("bio_segment", []),
        "coupling_points": route.get("coupling_points", []),
    }