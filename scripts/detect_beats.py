#!/usr/bin/env python3
"""Detect beat positions in an audio file and output JSON.

Usage: python scripts/detect_beats.py <audio_file> [--output <path>]
Output: { "beatTimestampsMs": [517, 1034, ...], "estimatedBpm": 116.0 }

If --output is omitted, writes to <audio_file_stem>.beats.json alongside the audio.
"""
import sys
import json
import argparse
from pathlib import Path

import librosa
import numpy as np


def detect_beats(audio_path: str) -> dict:
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    beat_timestamps_ms = [round(float(t) * 1000, 1) for t in beat_times]

    estimated_bpm = float(np.median(tempo)) if hasattr(tempo, "__iter__") else float(tempo)

    return {
        "beatTimestampsMs": beat_timestamps_ms,
        "estimatedBpm": round(estimated_bpm, 2),
    }


def main():
    parser = argparse.ArgumentParser(description="Detect beats in an audio file.")
    parser.add_argument("audio_file", help="Path to audio file (wav, mp3, etc.)")
    parser.add_argument("--output", "-o", default=None, help="Output JSON path")
    args = parser.parse_args()

    result = detect_beats(args.audio_file)

    out_path = args.output
    if not out_path:
        stem = Path(args.audio_file).stem
        out_path = str(Path(args.audio_file).parent / f"{stem}.beats.json")

    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(
        f"Detected {len(result['beatTimestampsMs'])} beats "
        f"(~{result['estimatedBpm']} BPM) -> {out_path}"
    )


if __name__ == "__main__":
    main()
