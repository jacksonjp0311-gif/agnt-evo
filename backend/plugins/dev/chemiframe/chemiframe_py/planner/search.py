from typing import Any, Dict
from chemiframe_py.blueprints.coupling import ArylCouplingBlueprint
from chemiframe.blueprints.sequence_assembly import SequenceAssemblyBlueprint
from chemiframe.blueprints.hybrid_interface import HybridInterfaceBlueprint
from chemiframe.blueprints.protection import ProtectionBlueprint
from chemiframe.blueprints.deprotection import DeprotectionBlueprint
from chemiframe.blueprints.purification import PurificationBlueprint
from chemiframe.blueprints.oligo_assembly import OligoAssemblyBlueprint
from chemiframe.blueprints.expanded import (
    GrignardBlueprint,
    DielsAlderBlueprint,
    ClickChemistryBlueprint,
    FriedelCraftsBlueprint,
    ReductiveAminationBlueprint,
    SNArBlueprint,
    EnzymaticBlueprint,
)


def select_blueprint(intent: Dict[str, Any]):
    """
    Select the best blueprint for the given intent.
    Order matters: more specific blueprints are checked first.
    Fallback to ArylCouplingBlueprint if nothing matches.
    """
    candidates = [
        # Hybrid / bio (most specific domain)
        HybridInterfaceBlueprint(),
        # Sequence / oligo
        OligoAssemblyBlueprint(),
        SequenceAssemblyBlueprint(),
        # Named reactions (specific)
        ClickChemistryBlueprint(),
        SNArBlueprint(),
        DielsAlderBlueprint(),
        GrignardBlueprint(),
        FriedelCraftsBlueprint(),
        ReductiveAminationBlueprint(),
        EnzymaticBlueprint(),
        # General coupling
        ArylCouplingBlueprint(),
        # Utility / fallback
        ProtectionBlueprint(),
        DeprotectionBlueprint(),
        PurificationBlueprint(),
    ]
    for candidate in candidates:
        if candidate.admissibility(intent):
            return candidate
    return ArylCouplingBlueprint()
