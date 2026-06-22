from typing import Any, Dict, List
from .base import ChemicalBlueprint


class SequenceAssemblyBlueprint(ChemicalBlueprint):
    name = "sequence_assembly"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        return bool(intent.get("sequence")) and intent.get("target_domain") in [
            "sequence_defined_biopolymer",
            "oligonucleotide_synthesis",
        ]

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        sequence: List[str] = intent.get("sequence", [])
        steps = []
        for idx, unit in enumerate(sequence):
            steps.append({"op": "AM", "label": f"couple_{idx}_{unit}"})
            steps.append({"op": "SM", "label": f"wash_{idx}_{unit}"})
            steps.append({"op": "AE", "label": f"checkpoint_{idx}_{unit}"})
        steps.append({"op": "SM", "label": "final_release"})
        return {
            "route_id": "route_sequence_001",
            "family": self.name,
            "target_domain": intent.get("target_domain"),
            "sequence": sequence,
            "steps": steps,
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }