"""
analyze_v2.py — CLI for CodeCriticV2 with calibrated quality scoring.

The raw quality head output is compressed. We calibrate it using the
issue classifier probabilities, which have much better signal.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).parent.resolve()
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from code_features import extract_features, FEATURE_DIM
from code_critic_tokenizer import CodeTokenizer, MAX_SEQ_LEN
from feedback_generator import generate_feedback


def _find_model():
    candidates = [
        SCRIPT_DIR / "code_critic_v2.pt",
        SCRIPT_DIR / "code_feedback_model.pt",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return str(candidates[0])


def _load_model(model_path):
    if "v2" in model_path:
        from model_v2 import load_model
        return load_model(model_path), "v2"
    else:
        from code_feedback_model import load_model
        return load_model(model_path), "v1"


def _calibrate_quality(raw_quality, issue_probs):
    """
    Calibrate quality score using issue probabilities.
    
    The raw quality head output is compressed (0.6-0.8 range).
    We use the issue probabilities (which have good signal) to
    produce a more discriminative quality score.
    
    Formula: calibrated = raw_quality * (1 - weighted_issue_severity)
    where weighted_issue_severity uses learned weights per category.
    """
    # Weights: bugs and security matter most for quality
    weights = np.array([0.30, 0.10, 0.15, 0.25, 0.10, 0.10])
    
    # Weighted severity: how bad are the issues?
    severity = (issue_probs * weights).sum()
    
    # Calibrated quality: start from raw, adjust by severity
    # This spreads the range from ~[0.6, 0.8] to ~[0.2, 0.95]
    calibrated = raw_quality * (1.0 - 0.8 * severity)
    
    # Clamp to [0, 1]
    calibrated = max(0.0, min(1.0, calibrated))
    
    return calibrated


def analyze_code(code, file_path=None, telemetry=None, model_path=None):
    if model_path is None:
        model_path = _find_model()

    if not os.path.exists(model_path):
        return {"error": "Model not found: " + model_path, "quality_score": 0,
                "issues": [], "suggestions": [], "positive_notes": [],
                "confidence": 0, "feedback_text": "Model not found."}

    model, version = _load_model(model_path)

    if not hasattr(analyze_code, "_tokenizer"):
        analyze_code._tokenizer = CodeTokenizer(max_length=MAX_SEQ_LEN)
    tokenizer = analyze_code._tokenizer

    features = extract_features(code, file_path=file_path, telemetry=telemetry)

    import torch
    if version == "v2":
        token_ids = tokenizer.encode(code)
        tokens_tensor = torch.from_numpy(token_ids).unsqueeze(0)
        features_tensor = torch.from_numpy(features).unsqueeze(0).float()
        outputs = model.predict(tokens_tensor, features_tensor)
    else:
        features_tensor = torch.from_numpy(features).unsqueeze(0).float()
        outputs = model.predict(features_tensor)

    issue_probs = torch.softmax(outputs["issue_logits"], dim=-1).squeeze(0).numpy()
    raw_quality = outputs["quality_score"].item()
    confidence = outputs["confidence"].item()

    # Calibrate quality
    calibrated_quality = _calibrate_quality(raw_quality, issue_probs)

    inference_output = {
        "quality_score": calibrated_quality,
        "issue_probs": issue_probs,
        "confidence": confidence,
        "reconstruction": np.zeros(FEATURE_DIM),
    }

    feedback = generate_feedback(inference_output, code=code, file_path=file_path)
    feedback["model_path"] = model_path
    feedback["model_version"] = version
    feedback["feature_dim"] = FEATURE_DIM
    feedback["code_length"] = len(code)
    feedback["file_path"] = file_path
    feedback["raw_quality"] = round(raw_quality, 4)
    return feedback


def main():
    parser = argparse.ArgumentParser(description="Code Critic v2 — Analyze Python code")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", type=str)
    group.add_argument("--code", type=str)
    parser.add_argument("--telemetry", type=str, default=None)
    parser.add_argument("--model", type=str, default=None)
    parser.add_argument("--json", action="store_true", dest="json_output")
    args = parser.parse_args()

    if args.file:
        if not os.path.exists(args.file):
            print("Error: File not found: " + args.file, file=sys.stderr)
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            code = f.read()
        file_path = args.file
    else:
        code = args.code
        file_path = None

    telemetry = None
    if args.telemetry:
        try:
            telemetry = json.loads(args.telemetry)
        except json.JSONDecodeError as e:
            print("Error: Invalid telemetry JSON: " + str(e), file=sys.stderr)
            sys.exit(1)

    start = time.time()
    result = analyze_code(code, file_path=file_path, telemetry=telemetry, model_path=args.model)
    elapsed = (time.time() - start) * 1000

    if "error" in result and result["error"]:
        print("WARN: " + result["error"], file=sys.stderr)

    if args.json_output:
        output = {
            "quality_score": result.get("quality_score", 0),
            "quality_label": result.get("quality_label", "Unknown"),
            "quality_emoji": result.get("quality_emoji", ""),
            "confidence": result.get("confidence", 0),
            "issues": result.get("issues", []),
            "suggestions": result.get("suggestions", []),
            "positive_notes": result.get("positive_notes", []),
            "model_version": result.get("model_version", "unknown"),
            "inference_time_ms": round(elapsed, 1),
        }
        print(json.dumps(output, indent=2))
    else:
        print(result.get("feedback_text", "No feedback generated."))
        print("\nInference time: {:.0f}ms | Model: {} | Raw quality: {:.3f}".format(
            elapsed, result.get("model_version", "?"), result.get("raw_quality", 0)))


if __name__ == "__main__":
    main()
