from typing import Any, Dict, List, Optional
from .base import ChemicalBlueprint


class GrignardBlueprint(ChemicalBlueprint):
    """
    Grignard addition reaction.
    Organomagnesium reagents (RMgX) add to carbonyl compounds (aldehydes, ketones)
    to form alcohols after aqueous workup.
    """
    name = "grignard_addition"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_organometallic = any(x in inputs for x in [
            "grignard_reagent", "organomagnesium", "rmgbr", "rmgcl"
        ])
        has_carbonyl = any(x in inputs for x in [
            "aldehyde", "ketone", "carbonyl", "ester", "acid_chloride"
        ])
        return has_organometallic and has_carbonyl

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_grignard_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_dry_reactor"},
                {"op": "AM", "label": "add_magnesium_turnings"},
                {"op": "AE", "label": "initiate_grignard_formation"},
                {"op": "AE", "label": "monitor_grignard_initiation"},
                {"op": "AM", "label": "add_carbonyl_substrate"},
                {"op": "AE", "label": "control_exotherm"},
                {"op": "AE", "label": "monitor_conversion"},
                {"op": "SM", "label": "quench_with_nh4cl"},
                {"op": "SM", "label": "extract_organic_layer"},
                {"op": "SM", "label": "dry_over_mgso4"},
                {"op": "SM", "label": "concentrate_under_vacuum"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class DielsAlderBlueprint(ChemicalBlueprint):
    """
    Diels-Alder [4+2] cycloaddition.
    A conjugated diene reacts with a dienophile to form a cyclohexene ring.
    Pericyclic reaction, typically thermally promoted.
    """
    name = "diels_alder"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_diene = any(x in inputs for x in [
            "diene", "butadiene", "cyclopentadiene", "isoprene", "anthracene"
        ])
        has_dienophile = any(x in inputs for x in [
            "dienophile", "alkene", "maleic_anhydride", "acrylonitrile", "acetylene"
        ])
        return has_diene and has_dienophile

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_da_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_reactor"},
                {"op": "AM", "label": "add_diene"},
                {"op": "AM", "label": "add_dienophile"},
                {"op": "AM", "label": "add_solvent_toluene"},
                {"op": "AE", "label": "heat_to_reflux"},
                {"op": "AE", "label": "monitor_conversion"},
                {"op": "SE", "label": "cool_to_rt"},
                {"op": "SM", "label": "concentrate_under_vacuum"},
                {"op": "SM", "label": "purify_by_column"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class ClickChemistryBlueprint(ChemicalBlueprint):
    """
    Cu(I)-catalyzed Azide-Alkyne Cycloaddition (CuAAC).
    The quintessential "click" reaction — high yield, mild conditions,
    bio-orthogonal, forms 1,2,3-triazole linkages.
    """
    name = "click_chemistry"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_azide = "azide" in inputs
        has_alkyne = "alkyne" in inputs
        return has_azide and has_alkyne

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_click_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_reactor"},
                {"op": "AM", "label": "add_azide"},
                {"op": "AM", "label": "add_alkyne"},
                {"op": "AM", "label": "add_cuso4_catalyst"},
                {"op": "AM", "label": "add_sodium_ascorbate"},
                {"op": "AM", "label": "add_solvent_dcm_water"},
                {"op": "AE", "label": "stir_at_rt"},
                {"op": "AE", "label": "monitor_by_tlc"},
                {"op": "SM", "label": "dilute_with_dcm"},
                {"op": "SM", "label": "wash_brine"},
                {"op": "SM", "label": "dry_over_na2so4"},
                {"op": "SM", "label": "concentrate_and_purify"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class FriedelCraftsBlueprint(ChemicalBlueprint):
    """
    Friedel-Crafts acylation/alkylation.
    Electrophilic aromatic substitution using AlCl3 catalyst.
    Acyl or alkyl halide reacts with an aromatic ring.
    """
    name = "friedel_crafts"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_aromatic = any(x in inputs for x in [
            "aromatic", "benzene", "toluene", "anisole", "phenol"
        ])
        has_electrophile = any(x in inputs for x in [
            "acyl_halide", "alkyl_halide", "acetyl_chloride", "benzyl_chloride"
        ])
        has_lewis_acid = any(x in inputs for x in [
            "alcl3", "lewis_acid", "fecl3", "bf3"
        ])
        return has_aromatic and has_electrophile and has_lewis_acid

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_fc_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_dry_reactor"},
                {"op": "AM", "label": "add_aromatic_substrate"},
                {"op": "AM", "label": "add_alcl3_catalyst"},
                {"op": "AE", "label": "stir_at_rt"},
                {"op": "AM", "label": "add_acyl_halide_dropwise"},
                {"op": "AE", "label": "monitor_conversion"},
                {"op": "SM", "label": "quench_with_ice_water"},
                {"op": "SM", "label": "extract_with_ether"},
                {"op": "SM", "label": "wash_with_nahco3"},
                {"op": "SM", "label": "dry_and_concentrate"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class ReductiveAminationBlueprint(ChemicalBlueprint):
    """
    Reductive amination.
    Carbonyl compound + amine → imine → reduced to amine.
    Uses NaBH(OAc)3 or NaBH3CN as reducing agent.
    """
    name = "reductive_amination"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_carbonyl = any(x in inputs for x in [
            "aldehyde", "ketone", "carbonyl"
        ])
        has_amine = any(x in inputs for x in [
            "amine", "primary_amine", "secondary_amine", "aniline"
        ])
        has_reducing_agent = any(x in inputs for x in [
            "nabh3cn", "nabh_oa3h3", "sodium_cyanoborohydride",
            "sodium_triacetoxyborohydride", "reducing_agent"
        ])
        return has_carbonyl and has_amine and has_reducing_agent

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_ra_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_reactor"},
                {"op": "AM", "label": "add_carbonyl_compound"},
                {"op": "AM", "label": "add_amine"},
                {"op": "AM", "label": "add_solvent_dce"},
                {"op": "AE", "label": "stir_1h_rt"},
                {"op": "AM", "label": "add_nabh3cn"},
                {"op": "AE", "label": "monitor_imine_formation"},
                {"op": "AE", "label": "stir_overnight"},
                {"op": "SM", "label": "quench_with_nahco3"},
                {"op": "SM", "label": "extract_with_ethyl_acetate"},
                {"op": "SM", "label": "dry_and_concentrate"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class SNArBlueprint(ChemicalBlueprint):
    """
    Nucleophilic Aromatic Substitution (SNAr).
    Electron-deficient aromatic ring undergoes substitution
    with a nucleophile. Requires activating groups (NO2, CN) ortho/para to leaving group.
    """
    name = "snar"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_deficient_aromatic = any(x in inputs for x in [
            "fluoronitrobenzene", "chloronitrobenzene",
            "activated_aryl_halide", "dinitrochlorobenzene"
        ])
        has_nucleophile = any(x in inputs for x in [
            "nucleophile", "amine", "alkoxide", "thiolate", "sodium_methoxide"
        ])
        return has_deficient_aromatic and has_nucleophile

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_snar_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "charge_reactor"},
                {"op": "AM", "label": "add_activated_aryl_halide"},
                {"op": "AM", "label": "add_nucleophile"},
                {"op": "AM", "label": "add_solvent_dmf"},
                {"op": "AE", "label": "heat_to_80c"},
                {"op": "AE", "label": "monitor_by_hplc"},
                {"op": "SE", "label": "cool_to_rt"},
                {"op": "SM", "label": "pour_into_water"},
                {"op": "SM", "label": "filter_precipitate"},
                {"op": "SM", "label": "wash_and_dry"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }


class EnzymaticBlueprint(ChemicalBlueprint):
    """
    Enzymatic / biocatalytic transformation.
    Uses enzymes (lipases, kinases, transaminases, etc.) for selective transformations.
    Mild conditions (aqueous, 25-40°C, neutral pH).
    """
    name = "enzymatic"

    def admissibility(self, intent: Dict[str, Any]) -> bool:
        inputs = intent.get("inputs", [])
        has_enzyme = any(x in inputs for x in [
            "enzyme", "lipase", "transaminase", "kinase",
            "esterase", "nitrilase", "catalyst_enzyme"
        ])
        has_substrate = any(x in inputs for x in [
            "substrate", "ester", "ketone_substrate", "prochiral_ketone"
        ])
        return has_enzyme and has_substrate

    def plan(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_id": "route_enzyme_001",
            "family": self.name,
            "target_domain": intent.get("target_domain", "small_molecule"),
            "steps": [
                {"op": "AM", "label": "prepare_buffer_ph7"},
                {"op": "AM", "label": "add_substrate"},
                {"op": "AM", "label": "add_enzyme"},
                {"op": "AM", "label": "add_cofactor_nadph"},
                {"op": "AE", "label": "incubate_37c"},
                {"op": "AE", "label": "monitor_by_hplc"},
                {"op": "AE", "label": "monitor_conversion"},
                {"op": "SM", "label": "quench_with_heat"},
                {"op": "SM", "label": "extract_product"},
                {"op": "SM", "label": "purify_by_chromatography"},
            ],
        }

    def verify(self, route: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "route_admissible": True,
            "dec_points_defined": True,
            "ordered_steps_ok": True,
        }
