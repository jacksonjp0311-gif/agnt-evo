"""
model_v3.py — Code Critic v3 (~3M params, clean).

Fixes: embed_dim divisible by num_heads, proper quality head, cross-attention fusion.
Size: ~3M params = ~6MB float16 (well under 100MB budget).
"""
import os
from typing import Dict
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from code_critic_tokenizer import VOCAB_SIZE, PAD, UNK

# Config — all dims cleanly divisible
FEAT_DIM = 128
EMBED = 256        # token embedding dim
HIDDEN = 256       # transformer hidden = also fusion hidden
LAYERS = 4
HEADS = 4          # 256/4 = 64, clean
ISSUES = 6
SEQ_LEN = 256
DROP = 0.1

class CodeCriticV3(nn.Module):
    def __init__(self):
        super().__init__()
        # Token path
        self.tok_emb = nn.Embedding(VOCAB_SIZE, EMBED, padding_idx=PAD)
        self.pos_emb = nn.Parameter(torch.randn(1, SEQ_LEN, EMBED) * 0.02)
        self.tok_norm = nn.LayerNorm(EMBED)
        enc = nn.TransformerEncoderLayer(EMBED, HEADS, EMBED*4, DROP, "gelu", batch_first=True, norm_first=True)
        self.tok_enc = nn.TransformerEncoder(enc, LAYERS)

        # Feature path
        self.feat_proj = nn.Sequential(
            nn.Linear(FEAT_DIM, HIDDEN), nn.LayerNorm(HIDDEN), nn.GELU(), nn.Dropout(DROP),
            nn.Linear(HIDDEN, EMBED), nn.LayerNorm(EMBED), nn.GELU(),
        )

        # Cross-attention fusion
        self.cross = nn.MultiheadAttention(EMBED, HEADS, dropout=DROP, batch_first=True)
        self.fuse_norm = nn.LayerNorm(EMBED)

        # Heads (deeper quality head)
        self.quality_head = nn.Sequential(
            nn.Linear(EMBED, HIDDEN), nn.GELU(), nn.Dropout(DROP),
            nn.Linear(HIDDEN, HIDDEN // 2), nn.GELU(),
            nn.Linear(HIDDEN // 2, 1),
        )
        self.issue_head = nn.Sequential(
            nn.Linear(EMBED, HIDDEN), nn.GELU(), nn.Dropout(DROP),
            nn.Linear(HIDDEN, ISSUES),
        )
        self.conf_head = nn.Sequential(
            nn.Linear(EMBED, HIDDEN // 2), nn.GELU(),
            nn.Linear(HIDDEN // 2, 1), nn.Sigmoid(),
        )
        self.mlm_head = nn.Linear(EMBED, VOCAB_SIZE)
        self._init()

    def _init(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None: nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Embedding):
                nn.init.normal_(m.weight, std=0.02)
            elif isinstance(m, nn.LayerNorm):
                nn.init.ones_(m.weight); nn.init.zeros_(m.bias)

    def encode(self, tok_ids, feats):
        B, T = tok_ids.shape
        T = min(T, SEQ_LEN)
        pad = (tok_ids[:, :T] == PAD)
        x = self.tok_emb(tok_ids[:, :T]) + self.pos_emb[:, :T]
        x = self.tok_norm(x)
        tok = self.tok_enc(x, src_key_padding_mask=pad)
        f = self.feat_proj(feats).unsqueeze(1)
        attn, _ = self.cross(f, tok, tok, key_padding_mask=pad)
        return self.fuse_norm(attn.squeeze(1))

    def forward(self, tok_ids, feats, mask_ratio=0.0):
        B, T = tok_ids.shape
        T = min(T, SEQ_LEN)
        mlm_logits = None
        if mask_ratio > 0.0 and self.training:
            special = (tok_ids[:, :T] == PAD)|(tok_ids[:, :T] == UNK)
            mask = (torch.rand(B,T,device=tok_ids.device) < mask_ratio) & ~special
            ids = tok_ids[:, :T].clone(); ids[mask] = UNK
            x = self.tok_emb(ids) + self.pos_emb[:, :T]
            x = self.tok_norm(x)
            enc = self.tok_encoder(x, src_key_padding_mask=(tok_ids[:, :T]==PAD))
            mlm_logits = self.mlm_head(enc)

        h = self.encode(tok_ids, feats)
        q = self.quality_head(h).squeeze(-1)  # raw, no sigmoid
        issues = self.issue_head(h)
        conf = self.conf_head(h).squeeze(-1)
        return {"quality_score": q, "issue_logits": issues, "confidence": conf, "mlm_logits": mlm_logits}

    @torch.no_grad()
    def predict(self, tok_ids, feats):
        self.eval()
        out = self.forward(tok_ids, feats)
        q = out["quality_score"]
        # Normalize to [0,1] — during batch inference use min-max, single use sigmoid
        if q.numel() > 1: q = (q - q.min()) / (q.max() - q.min() + 1e-8)
        else: q = torch.sigmoid(q - 1.0)
        out["quality_score"] = q
        return out

def save_model(model, path):
    torch.save({"w": {k:v.half() for k,v in model.state_dict().items()}}, path)
    print(f"Saved {path} ({os.path.getsize(path)/1024/1024:.2f} MB)")

def load_model(path):
    s = torch.load(path, map_location="cpu", weights_only=True)
    m = CodeCriticV3()
    m.load_state_dict({k:v.float() for k,v in s["w"].items()})
    m.eval()
    return m

def count_params(m): return sum(p.numel() for p in m.parameters() if p.requires_grad)

if __name__ == "__main__":
    m = CodeCriticV3()
    print(f"Params: {count_params(m):,} ({count_params(m)/1e6:.2f}M)")
    t = torch.randint(0, VOCAB_SIZE, (2, 128))
    f = torch.randn(2, FEAT_DIM)
    o = m(t, f)
    print(f"quality: {o['quality_score'].shape} {o['quality_score'].tolist()}")
    save_model(m, "_test_v3.pt")
    m2 = load_model("_test_v3.pt")
    o2 = m2.predict(t, f)
    print(f"predict: {o2['quality_score'].tolist()}")
    os.remove("_test_v3.pt")
    print("v3 OK")
