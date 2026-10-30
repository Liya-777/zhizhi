#!/usr/bin/env python3
"""Download embedding model from ModelScope (complete with config/tokenizer).

Usage:
    python scripts/download_model.py [--model BAAI/bge-small-zh-v1.5] [--cache-dir /path/to/models]

The default cache_dir respects MODELS_DIR from .env if available, otherwise ./models.
"""

import argparse
import os
import sys

# Allow running from repo root or backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modelscope import snapshot_download

DEFAULT_MODEL = "BAAI/bge-small-zh-v1.5"


def main():
    parser = argparse.ArgumentParser(description="Download embedding model from ModelScope")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"ModelScope model name (default: {DEFAULT_MODEL})")
    parser.add_argument(
        "--cache-dir",
        default=None,
        help="Local cache directory (default: MODELS_DIR from .env, or ./models)",
    )
    args = parser.parse_args()

    # Resolve cache_dir
    cache_dir = args.cache_dir
    if not cache_dir:
        try:
            from app.core.config import settings
            cache_dir = settings.models_dir
        except Exception:
            cache_dir = os.path.join(os.path.dirname(__file__), "..", "models")

    os.makedirs(cache_dir, exist_ok=True)

    print(f"⬇  Downloading {args.model} from ModelScope...")
    print(f"   Cache directory: {cache_dir}")

    local_path = snapshot_download(
        args.model,
        cache_dir=cache_dir,
        revision="master",
    )

    print(f"\n✅ Model downloaded to: {local_path}")

    # Verify required files exist
    required = ["config.json", "tokenizer.json", "model.safetensors"]
    missing = [f for f in required if not os.path.exists(os.path.join(local_path, f))]

    # sentence-transformers often uses tokenizer_config.json or vocab.txt too
    optional = ["tokenizer_config.json", "vocab.txt", "special_tokens_map.json",
                "sentence_bert_config.json", "modules.json"]
    missing_opt = [f for f in optional if not os.path.exists(os.path.join(local_path, f))]

    if missing:
        print(f"\n❌ Missing required files: {missing}")
        print("   The model download appears incomplete. Try re-running the script.")
        sys.exit(1)
    else:
        print("   ✅ Required files: all present")

    if missing_opt:
        print(f"   ⚠  Optional files missing (may not affect loading): {missing_opt}")
    else:
        print("   ✅ Optional files: all present")

    # Quick load test
    print("\n🧪 Testing model load...")
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(local_path)
        dim = model.get_sentence_embedding_dimension()
        print(f"   ✅ Model loads successfully! Embedding dimension: {dim}")
    except Exception as e:
        print(f"   ❌ Model load failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
