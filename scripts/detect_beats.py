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
Use --output - to print JSON to stdout only (e.g. when using --start-sec/--end-sec for section detection).
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


def detect_beats_onset(audio_path, min_gap_ms=250.0, start_sec=None, end_sec=None, fill_grid=False, bpm_hint=None):
    # type: (str, float, Optional[float], Optional[float], bool, Optional[float]) -> dict
    """Detect beats via percussive onset peaks — no tempo grid imposed.
    If fill_grid=True and we have a segment (start_sec/end_sec), estimate BPM from onsets
    (or use bpm_hint if given) and output a full beat grid (one timestamp per beat) to fix
    'every 2nd/3rd beat' sparse output.
    """
    kwargs = {"sr": None, "mono": True}
    if start_sec is not None and end_sec is not None:
        kwargs["offset"] = float(start_sec)
        kwargs["duration"] = float(end_sec - start_sec)
    y, sr = librosa.load(audio_path, **kwargs)
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

    offset_ms = (float(start_sec) * 1000) if start_sec is not None else 0
    beat_times_s = list(onset_times)

    # Option: fill a regular grid from first onset so we get one beat per beat (fixes sparse output)
    grid_bpm = (bpm_hint if bpm_hint and bpm_hint > 0 else None) or (estimated_bpm if estimated_bpm > 0 else None)
    if fill_grid and start_sec is not None and end_sec is not None and len(onset_times) >= 1 and grid_bpm and grid_bpm > 0:
        segment_duration_s = float(end_sec - start_sec)
        beat_interval_s = 60.0 / grid_bpm
        t0 = float(onset_times[0])
        grid_times = []
        t = t0
        while t < segment_duration_s + 0.001:
            if t >= 0:
                grid_times.append(t)
            t += beat_interval_s
        beat_times_s = grid_times

    # Whole milliseconds are enough for beat grid; sub-ms precision is redundant.
    return {
        "beatTimestampsMs": [round(offset_ms + t * 1000) for t in beat_times_s],
        "estimatedBpm": round(estimated_bpm, 2),
    }


def detect_beats_beattrack(audio_path, bpm_hint=None, tightness=80, start_sec=None, end_sec=None):
    # type: (str, Optional[float], float, Optional[float], Optional[float]) -> dict
    """Classic beat_track with percussive preprocessing."""
    kwargs = {"sr": None, "mono": True}
    if start_sec is not None and end_sec is not None:
        kwargs["offset"] = float(start_sec)
        kwargs["duration"] = float(end_sec - start_sec)
    y, sr = librosa.load(audio_path, **kwargs)
    oenv = _onset_envelope_percussive(y, sr)

    kwargs = dict(
        onset_envelope=oenv, sr=sr, hop_length=HOP_LENGTH,
        units="frames", tightness=tightness,
    )
    if bpm_hint is not None:
        kwargs["start_bpm"] = bpm_hint

    tempo, beat_frames = librosa.beat.beat_track(**kwargs)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH)
    offset_ms = (float(start_sec) * 1000) if start_sec is not None else 0
    # Whole milliseconds are enough for beat grid; sub-ms precision is redundant.
    beat_timestamps_ms = [round(offset_ms + float(t) * 1000) for t in beat_times]
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
        help="[onset method] Minimum ms between beats when --bpm not set (default: 250). When --bpm is set, min gap is derived from BPM (half beat).",
    )
    parser.add_argument(
        "--start-sec", type=float, default=None,
        help="Start time of segment in seconds (use with --end-sec for section detection)",
    )
    parser.add_argument(
        "--end-sec", type=float, default=None,
        help="End time of segment in seconds (use with --start-sec for section detection)",
    )
    parser.add_argument(
        "--fill-grid", action="store_true",
        help="[onset + segment] After onset detection, output a full beat grid from estimated BPM (fixes sparse every-2nd-beat output)",
    )
    args = parser.parse_args()

    start_sec = args.start_sec
    end_sec = args.end_sec
    if (start_sec is None) != (end_sec is None):
        sys.stderr.write("Both --start-sec and --end-sec must be provided together.\n")
        sys.exit(1)

    if args.method == "onset":
        # When BPM is provided, derive min gap from it (half beat) so faster tempos get tighter spacing
        if args.bpm is not None and args.bpm > 0:
            min_gap_ms = max(80.0, min(2000.0, 30000.0 / args.bpm))
        else:
            min_gap_ms = args.min_gap
        result = detect_beats_onset(
            args.audio_file, min_gap_ms=min_gap_ms,
            start_sec=start_sec, end_sec=end_sec,
            fill_grid=args.fill_grid,
            bpm_hint=args.bpm,
        )
    else:
        result = detect_beats_beattrack(
            args.audio_file, bpm_hint=args.bpm, tightness=args.tightness,
            start_sec=start_sec, end_sec=end_sec,
        )

    out_path = args.output
    if out_path is None:
        stem = Path(args.audio_file).stem
        out_path = str(Path(args.audio_file).parent / f"{stem}.beats.json")

    if out_path == "-":
        print(json.dumps(result, indent=2))
    else:
        with open(out_path, "w") as f:
            json.dump(result, f, indent=2)
        print(
            f"[{args.method}] Detected {len(result['beatTimestampsMs'])} beats "
            f"(~{result['estimatedBpm']} BPM) -> {out_path}"
        )


if __name__ == "__main__":
    main()
