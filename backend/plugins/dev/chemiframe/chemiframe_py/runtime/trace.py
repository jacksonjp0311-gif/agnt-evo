from pathlib import Path
from typing import Any, Dict
import json


def store(run: Dict[str, Any], artifacts_root: str = "artifacts/traces") -> str:
    p = Path(artifacts_root)
    p.mkdir(parents=True, exist_ok=True)
    run_id = str(run.get("id") or run.get("run_id") or "run_unknown")
    path = p / f"{run_id}.json"
    path.write_text(json.dumps(run, indent=2), encoding="utf-8")
    return str(path)


def load(run_id: str, artifacts_root: str = "artifacts/traces") -> Dict[str, Any]:
    p = Path(artifacts_root) / f"{run_id}.json"
    return json.loads(p.read_text(encoding="utf-8"))