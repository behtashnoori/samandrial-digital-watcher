from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, List

import faiss
import numpy as np
from flask import current_app


DIM = 128


def _index_paths() -> tuple[str, str]:
    base = os.path.join(current_app.root_path, "rag_index")
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, "index.faiss"), os.path.join(base, "meta.jsonl")


def _load_index() -> tuple[faiss.IndexFlatL2, List[Dict[str, Any]]]:
    idx_path, meta_path = _index_paths()
    if os.path.exists(idx_path):
        index = faiss.read_index(idx_path)
    else:
        index = faiss.IndexFlatL2(DIM)
    meta: List[Dict[str, Any]] = []
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = [json.loads(line) for line in f]
    return index, meta


def _save_index(index: faiss.IndexFlatL2, meta: List[Dict[str, Any]]) -> None:
    idx_path, meta_path = _index_paths()
    faiss.write_index(index, idx_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        for m in meta:
            f.write(json.dumps(m, ensure_ascii=False) + "\n")


def _embed(text: str) -> np.ndarray:
    vec = np.zeros(DIM, dtype="float32")
    for token in text.lower().split():
        h = int(hashlib.md5(token.encode()).hexdigest(), 16)
        vec[h % DIM] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


def index_response(resp_text: str, meta_info: Dict[str, Any]) -> None:
    index, meta = _load_index()
    chunks = [resp_text[i : i + 200] for i in range(0, len(resp_text), 200)]
    for chunk in chunks:
        vec = _embed(chunk)
        index.add(np.expand_dims(vec, axis=0))
        meta.append({"text": chunk, **meta_info})
    _save_index(index, meta)


def search(query: str, k: int = 5) -> List[Dict[str, Any]]:
    index, meta = _load_index()
    if index.ntotal == 0:
        return []
    vec = _embed(query)
    D, I = index.search(np.expand_dims(vec, axis=0), k)
    results: List[Dict[str, Any]] = []
    for idx in I[0]:
        if 0 <= idx < len(meta):
            results.append(meta[idx])
    return results
