from pathlib import Path
from typing import Any, Dict
import json


def load_intent(path: str) -> Dict[str, Any]:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    text = text.strip()
    if text.startswith("{"):
        return json.loads(text)

    data: Dict[str, Any] = {}
    current_parent = None
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        if line.startswith("  ") and current_parent:
            key, value = [x.strip() for x in line.split(":", 1)]
            data.setdefault(current_parent, {})[key] = _coerce(value)
        else:
            key, value = [x.strip() for x in line.split(":", 1)]
            if value == "":
                current_parent = key
                data[key] = {}
            else:
                current_parent = None
                data[key] = _coerce(value)
    return data


def _coerce(value: str):
    low = value.lower()
    if low == "true":
        return True
    if low == "false":
        return False
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip().strip('"\'') for part in inner.split(",")]
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value.strip('"\'')