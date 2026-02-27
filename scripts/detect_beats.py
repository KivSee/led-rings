#!/usr/bin/env python3
"""Detect beat positions in an audio file and output JSON.

Usage:
  python scripts/detect_beats.py <audio_file> [options]

Methods:
  onset   - (default) Percussion-focused onset detection. No tempo grid assumed.
            Best for variable-tempo or live-performed audio.
  beats   - Classic librosa beat tracker with optional BPM hint.
            Best for constant-tempo electronic/pop music.

Output: { "beatTimestampsMs": [517, 1034, ...], "estimatedBpm": 116.0 }

If --output is omitted, writes to <audio_file_stem>.beats.json alongside the audio.
"""
import sys
import json
import argparse
from pathlib import Path
from typing import Optional

import librosa
import numpy as np

HOP_LENGTH = 512


def _onset_envelope_percussive(y, sr):
    """Build an onset envelope from only the percussive component."""
    y_perc = librosa.effects.percussive(y, margin=3.0)
    return librosa.onset.onset_strength(
        y=y_perc, sr=sr,
        hop_length=HOP_LENGTH,
        aggregate=np.median,
        fmax=8000,
        n_mels=128,
    )


def detect_beats_onset(audio_path, min_gap_ms=250.0):
    # type: (str, float) -> dict
    """Detect beats via percussive onset peaks — no tempo grid imposed."""
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    oenv = _onset_envelope_percussive(y, sr)

    # Adaptive threshold: onsets must be above the local mean + a fraction of
    # the global dynamic range to count as a beat.
    onset_frames = librosa.onset.onset_detect(
        onset_envelope=oenv, sr=sr, hop_length=HOP_LENGTH,
        backtrack=True, units="frames",
        delta=0.07,
        wait=int(min_gap_ms / 1000.0 * sr / HOP_LENGTH),
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=HOP_LENGTH)

    # Enforce minimum gap (wait param should handle this, but be safe)
    min_gap_s = min_gap_ms / 1000.0
    filtered = []
    for t in onset_times:
        if len(filtered) == 0 or (t - filtered[-1]) >= min_gap_s:
            filtered.append(float(t))
    onset_times = filtered

    if len(onset_times) >= 2:
        ibis = np.diff(onset_times)
        estimated_bpm = 60.0 / float(np.median(ibis))
    else:
        estimated_bpm = 0.0

    return {
        "beatTimestampsMs": [round(t * 1000, 1) for t in onset_times],
        "estimatedBpm": round(estimated_bpm, 2),
    }


def detect_beats_beattrack(audio_path, bpm_hint=None, tightness=80):
    # type: (str, Optional[float], float) -> dict
    """Classic beat_track with percussive preprocessing."""
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    oenv = _onset_envelope_percussive(y, sr)

    kwargs = dict(
        onset_envelope=oenv, sr=sr, hop_length=HOP_LENGTH,
        units="frames", tightness=tightness,
    )
    if bpm_hint is not None:
        kwargs["start_bpm"] = bpm_hint

    tempo, beat_frames = librosa.beat.beat_track(**kwargs)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH)
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
    parser.add_argument(
        "--method", choices=["onset", "beats"], default="onset",
        help="Detection method: 'onset' (default, variable tempo) or 'beats' (constant tempo grid)",
    )
    parser.add_argument(
        "--bpm", type=float, default=None,
        help="[beats method] Approximate BPM hint",
    )
    parser.add_argument(
        "--tightness", type=float, default=80,
        help="[beats method] Tempo grid rigidity (default: 80)",
    )
    parser.add_argument(
        "--min-gap", type=float, default=250,
        help="[onset method] Minimum ms between beats (default: 250)",
    )
    args = parser.parse_args()

    if args.method == "onset":
        result = detect_beats_onset(args.audio_file, min_gap_ms=args.min_gap)
    else:
        result = detect_beats_beattrack(args.audio_file, bpm_hint=args.bpm, tightness=args.tightness)

    out_path = args.output
    if not out_path:
        stem = Path(args.audio_file).stem
        out_path = str(Path(args.audio_file).parent / f"{stem}.beats.json")

    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(
        f"[{args.method}] Detected {len(result['beatTimestampsMs'])} beats "
        f"(~{result['estimatedBpm']} BPM) -> {out_path}"
    )


if __name__ == "__main__":
    main()
