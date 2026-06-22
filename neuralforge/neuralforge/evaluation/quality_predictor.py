"""
Model Quality Predictor — Neural net that predicts final model quality
from early training dynamics (loss curves, gradient norms, LR history).

This enhances the evaluate tool by adding a learned quality score that
can predict "will this model reach target accuracy?" from just the
first few epochs of training — enabling early stopping decisions and
architecture comparison without full training.
"""
from __future__ import annotations
import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

logger = logging.getLogger("neuralforge.evaluation.quality_predictor")


class TrainingDynamicsEncoder(nn.Module):
    """Encodes training history (loss curve, LR curve, grad norms) into a fixed-size vector.

    Input: (batch, seq_len, 3) — 3 channels: [train_loss, val_loss, learning_rate]
    Output: (batch, hidden_dim) — compressed representation
    """

    def __init__(self, seq_len: int = 50, hidden_dim: int = 64):
        super().__init__()
        self.conv1 = nn.Conv1d(3, 16, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(16, 32, kernel_size=3, padding=1)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.fc = nn.Linear(32, hidden_dim)
        self.norm = nn.LayerNorm(hidden_dim)

    def forward(self, x):
        # x: (batch, seq_len, 3) -> (batch, 3, seq_len)
        x = x.transpose(1, 2)
        x = F.gelu(self.conv1(x))
        x = F.gelu(self.conv2(x))
        x = self.pool(x).squeeze(-1)  # (batch, 32)
        x = self.norm(self.fc(x))    # (batch, hidden_dim)
        return x


class QualityPredictorNet(nn.Module):
    """Predicts model quality score from training dynamics + architecture metadata.

    Architecture metadata (concatenated after dynamics encoding):
      - log(params), depth, width, num_classes
      - task_type embedding (8 dims)
      - family embedding (8 dims)
    """

    def __init__(self, seq_len: int = 50, hidden_dim: int = 64, num_tasks: int = 12, num_families: int = 16):
        super().__init__()
        self.dynamics_encoder = TrainingDynamicsEncoder(seq_len, hidden_dim)
        self.task_embed = nn.Embedding(num_tasks, 8)
        self.family_embed = nn.Embedding(num_families, 8)
        # dynamics(64) + arch_meta(4) + task(8) + family(8) = 84
        self.predictor = nn.Sequential(
            nn.Linear(hidden_dim + 4 + 8 + 8, 64),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(64, 32),
            nn.GELU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),  # output: quality score 0-1
        )

    def forward(self, dynamics, arch_meta, task_idx, family_idx):
        d = self.dynamics_encoder(dynamics)          # (batch, hidden_dim)
        t = self.task_embed(task_idx)                 # (batch, 8)
        f = self.family_embed(family_idx)             # (batch, 8)
        combined = torch.cat([d, arch_meta, t, f], dim=-1)
        return self.predictor(combined).squeeze(-1)   # (batch,)


class ModelQualityPredictor:
    """High-level interface for predicting model quality from training history.

    Usage:
        predictor = ModelQualityPredictor()
        predictor.train_on_history(training_histories, final_accuracies)
        quality_score = predictor.predict(training_history, arch_metadata)
    """

    # Task type -> index mapping
    TASK_MAP = {
        "image_classification": 0, "text_classification": 1, "text_generation": 2,
        "object_detection": 3, "image_segmentation": 4, "regression": 5,
        "time_series": 6, "anomaly_detection": 7, "rl_policy": 8,
        "multimodal": 9, "audio_classification": 10, "seq2seq": 11,
    }

    FAMILY_MAP = {
        "cnn": 0, "resnet": 1, "transformer": 2, "vit": 3,
        "mlp_mixer": 4, "kan": 5, "mamba": 6, "ssm": 7,
        "rwkv": 8, "liquid": 9, "diffusion": 10, "flow_matching": 11,
        "graph_nn": 12, "moe": 13, "retnet": 14, "custom": 15,
    }

    def __init__(self, seq_len: int = 50, hidden_dim: int = 64, device: Optional[torch.device] = None):
        self.seq_len = seq_len
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = QualityPredictorNet(seq_len=seq_len, hidden_dim=hidden_dim).to(self.device)
        self.is_trained = False
        self.training_history: List[Dict] = []

    def _pad_sequence(self, values: List[float]) -> np.ndarray:
        """Pad or truncate a sequence to fixed length."""
        arr = np.array(values, dtype=np.float32)
        if len(arr) >= self.seq_len:
            # Downsample by taking evenly spaced indices
            indices = np.linspace(0, len(arr) - 1, self.seq_len, dtype=int)
            return arr[indices]
        # Pad with last value
        padded = np.full(self.seq_len, arr[-1] if len(arr) > 0 else 0.0, dtype=np.float32)
        padded[:len(arr)] = arr
        return padded

    def _prepare_dynamics(self, history: Dict[str, List[float]]) -> torch.Tensor:
        """Convert training history dict to tensor (1, seq_len, 3)."""
        train_loss = self._pad_sequence(history.get("train_loss", []))
        val_loss = self._pad_sequence(history.get("val_loss", history.get("train_loss", [])))
        lr = self._pad_sequence(history.get("lr", [0.001]))

        # Normalize
        max_loss = max(train_loss.max(), val_loss.max(), 1.0)
        train_loss = train_loss / max_loss
        val_loss = val_loss / max_loss
        lr = lr / (lr.max() + 1e-8)

        tensor = np.stack([train_loss, val_loss, lr], axis=-1)  # (seq_len, 3)
        return torch.tensor(tensor, dtype=torch.float32).unsqueeze(0).to(self.device)

    def _prepare_arch_meta(self, num_params: int, depth: int, width: int, num_classes: int) -> torch.Tensor:
        """Convert architecture metadata to tensor (1, 4)."""
        meta = np.array([
            np.log10(max(num_params, 1)),
            float(depth or 4),
            float(width or 64),
            float(num_classes or 10),
        ], dtype=np.float32)
        return torch.tensor(meta, dtype=torch.float32).unsqueeze(0).to(self.device)

    def train_on_history(
        self,
        histories: List[Dict[str, List[float]]],
        final_accuracies: List[float],
        arch_metadata: Optional[List[Dict]] = None,
        task_types: Optional[List[str]] = None,
        family_types: Optional[List[str]] = None,
        epochs: int = 100,
        lr: float = 1e-3,
    ) -> Dict[str, float]:
        """Train the quality predictor on observed training histories + final accuracies.

        Args:
            histories: List of training history dicts with keys: train_loss, val_loss, lr
            final_accuracies: List of final accuracy values (0-1) for each history
            arch_metadata: Optional list of dicts with keys: num_params, depth, width, num_classes
            task_types: Optional list of task type strings
            family_types: Optional list of architecture family strings
            epochs: Training epochs for the predictor
            lr: Learning rate for the predictor

        Returns:
            Dict with final loss and correlation
        """
        if len(histories) < 2:
            logger.warning("Need at least 2 training histories to train predictor")
            return {"loss": float("inf"), "correlation": 0.0}

        optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

        # Default arch metadata
        if arch_metadata is None:
            arch_metadata = [{"num_params": 1_000_000, "depth": 4, "width": 64, "num_classes": 10}] * len(histories)
        if task_types is None:
            task_types = ["image_classification"] * len(histories)
        if family_types is None:
            family_types = ["resnet"] * len(histories)

        best_loss = float("inf")
        for epoch in range(epochs):
            self.model.train()
            total_loss = 0.0

            for i, (hist, acc) in enumerate(zip(histories, final_accuracies)):
                dynamics = self._prepare_dynamics(hist)
                arch = self._prepare_arch_meta(**arch_metadata[i])
                task_idx = torch.tensor([self.TASK_MAP.get(task_types[i], 0)], dtype=torch.long, device=self.device)
                family_idx = torch.tensor([self.FAMILY_MAP.get(family_types[i], 0)], dtype=torch.long, device=self.device)
                target = torch.tensor([acc], dtype=torch.float32, device=self.device)

                pred = self.model(dynamics, arch, task_idx, family_idx)
                loss = F.mse_loss(pred, target)

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            scheduler.step()
            avg_loss = total_loss / len(histories)
            if avg_loss < best_loss:
                best_loss = avg_loss

            if (epoch + 1) % 20 == 0:
                logger.info(f"Predictor epoch {epoch+1}/{epochs}, loss={avg_loss:.4f}")

        self.is_trained = True
        self.training_history = histories

        # Compute correlation
        predictions = []
        targets = []
        self.model.eval()
        with torch.no_grad():
            for i, hist in enumerate(histories):
                dynamics = self._prepare_dynamics(hist)
                arch = self._prepare_arch_meta(**arch_metadata[i])
                task_idx = torch.tensor([self.TASK_MAP.get(task_types[i], 0)], dtype=torch.long, device=self.device)
                family_idx = torch.tensor([self.FAMILY_MAP.get(family_types[i], 0)], dtype=torch.long, device=self.device)
                pred = self.model(dynamics, arch, task_idx, family_idx)
                predictions.append(pred.item())
                targets.append(final_accuracies[i])

        if len(predictions) > 1:
            correlation = float(np.corrcoef(predictions, targets)[0, 1])
        else:
            correlation = 0.0

        return {"loss": best_loss, "correlation": correlation}

    def predict(
        self,
        history: Dict[str, List[float]],
        num_params: int = 1_000_000,
        depth: int = 4,
        width: int = 64,
        num_classes: int = 10,
        task_type: str = "image_classification",
        family_type: str = "resnet",
    ) -> Dict[str, float]:
        """Predict model quality from partial training history.

        Returns a quality score 0-1 and confidence estimate.
        """
        self.model.eval()
        with torch.no_grad():
            dynamics = self._prepare_dynamics(history)
            arch = self._prepare_arch_meta(num_params, depth, width, num_classes)
            task_idx = torch.tensor([self.TASK_MAP.get(task_type, 0)], dtype=torch.long, device=self.device)
            family_idx = torch.tensor([self.FAMILY_MAP.get(family_type, 0)], dtype=torch.long, device=self.device)
            score = self.model(dynamics, arch, task_idx, family_idx).item()

        # Confidence based on how much history we have
        num_epochs = len(history.get("train_loss", []))
        confidence = min(1.0, num_epochs / 10.0)  # Full confidence at 10+ epochs

        return {
            "quality_score": round(score, 4),
            "confidence": round(confidence, 2),
            "is_trained": self.is_trained,
            "epochs_observed": num_epochs,
        }

    def compare_architectures(
        self,
        histories: Dict[str, Dict[str, List[float]]],
        arch_metadata: Dict[str, Dict],
        task_type: str = "image_classification",
    ) -> List[Dict[str, any]]:
        """Compare multiple architectures and rank them by predicted quality."""
        results = []
        for name, hist in histories.items():
            meta = arch_metadata.get(name, {})
            pred = self.predict(history=hist, task_type=task_type, **meta)
            results.append({"name": name, **pred, "arch": meta})

        results.sort(key=lambda x: x["quality_score"], reverse=True)
        return results
