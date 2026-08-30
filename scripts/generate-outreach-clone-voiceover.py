#!/usr/bin/env python3
"""Generate a consented Fiker voice-over from her own outreach-video audio."""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", required=True)
    parser.add_argument("--text-file", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--cache-dir", required=True)
    parser.add_argument("--exaggeration", type=float, default=0.38)
    parser.add_argument("--cfg-weight", type=float, default=0.48)
    args = parser.parse_args()

    reference = Path(args.reference).resolve()
    text = Path(args.text_file).read_text(encoding="utf-8").strip()
    output = Path(args.out).resolve()
    cache = Path(args.cache_dir).resolve()
    if not reference.exists():
        raise SystemExit(f"Reference audio not found: {reference}")
    if not text:
        raise SystemExit("Narration text is empty")

    for folder in ("matplotlib", "tts", "huggingface", "fontconfig"):
        (cache / folder).mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("MPLCONFIGDIR", str(cache / "matplotlib"))
    os.environ.setdefault("XDG_CACHE_HOME", str(cache))
    os.environ.setdefault("TTS_HOME", str(cache / "tts"))
    os.environ.setdefault("HF_HOME", str(cache / "huggingface"))
    os.environ.setdefault("TRANSFORMERS_CACHE", str(cache / "huggingface" / "transformers"))
    os.environ.setdefault("FONTCONFIG_PATH", str(cache / "fontconfig"))

    import torch
    import torchaudio as ta
    from chatterbox.tts import ChatterboxTTS

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"device={device} reference={reference}", flush=True)
    model = ChatterboxTTS.from_pretrained(device=device)
    wav = model.generate(
        text,
        audio_prompt_path=str(reference),
        exaggeration=args.exaggeration,
        cfg_weight=args.cfg_weight,
    )
    if wav.ndim == 1:
        wav = wav.unsqueeze(0)
    output.parent.mkdir(parents=True, exist_ok=True)
    ta.save(str(output), wav.cpu(), int(getattr(model, "sr", 24000)))
    print(output, flush=True)


if __name__ == "__main__":
    main()
