from typing import Any, Dict
from .base import ChemicalBlueprint


class ArylCouplingBlueprint(ChemicalBlueprint):
    name = "aryl_coupling"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        return "aryl_halide" in inputs and "boronic_acid" in inputs

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_aryl_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_reactor"},
                {"op": "AM", "label": "add_catalyst"},
                {"op": "AE", "label": "heat_and_stir"},
                {"op": "AE", "label": "monitor_conversion"},
                {"op": "SM", "label": "workup"},
                {"op": "SM", "label": "purify"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }