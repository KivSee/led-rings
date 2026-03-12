# Beat detection with variable BPM

Songs with many BPM changes are hard for beat detectors. This doc explains why and what you can do.

## Why you see “every 2nd or 3rd beat” or wrong phase

1. **Single global BPM**  
   The pipeline uses one BPM hint for the whole song. If you run detection per segment but still send the same BPM every time, segments with a different tempo get the wrong grid.

2. **Phase / half-time**  
   `librosa.beat.beat_track` (the `beats` method) assumes roughly constant tempo and can lock onto:
   - **Half-time**: one “beat” every two real beats (e.g. only on kick).
   - **Wrong phase**: grid aligned to the wrong downbeat, so only every 2nd or 3rd beat lines up.

3. **Onset-only**  
   The default `onset` method only returns detected onset times. If the detector fires mainly on strong hits (e.g. kick), you get fewer events than actual beats, so the timeline “fills in” between them and can look like every 2nd beat is correct.

4. **Segment boundaries**  
   When you run on a segment, the tracker has no memory of the previous segment. It can lock onto a different phase or tempo inside the window, so the first few beats may align and then it drifts.

## Ways to tackle it

### 1. Use a **BPM override per range** (recommended for segment runs)

- In the **spectrogram** toolbar (when **Edit beats** is on), choose **Range** and set **“BPM for this range”** to the section’s actual BPM (leave empty to use the song’s global BPM).
- Run detection once per section with that section’s BPM. Merged results will have the right tempo per region.

### 2. Prefer **onset** for variable tempo

- The **onset** method does not assume a fixed tempo grid, so it’s often better when BPM changes.
- If you get too few beats (only strong hits), try:
  - **Lower `min_gap_ms`** (e.g. 200 ms) in the script so closer onsets are allowed (when BPM is not set, the UI uses the script default), or
  - Use **Fill grid**: when using **Range** with the **onset** method, enable **Fill grid** in the spectrogram toolbar. The script detects onsets, estimates BPM from them (or uses your range BPM), then outputs a full beat grid for that segment so you get one timestamp per beat.

### 3. If using **beats** method

- Use **per-range BPM** so each segment gets the correct hint.
- **Lower tightness** (e.g. 50–60) so the grid can follow local tempo a bit more.
- Be aware the tracker can still choose half-time or wrong phase; per-segment BPM and shorter segments help.

### 4. Shorter segments with overlap (manual workflow)

- Run detection on short segments (e.g. 8–16 bars) with the correct BPM for each.
- Slightly overlap segments (e.g. 1 bar) and merge; the merge step dedupes nearby beats, so overlap avoids gaps at boundaries.

### 5. Onset + local grid (implemented)

- The **onset** method with **Fill grid** (UI checkbox when using Range; `--fill-grid` in `detect_beats.py`) does the following:
  - Detect onsets in the segment,
  - Estimate BPM from median inter-onset interval (or use the range BPM / `--bpm` hint),
  - Output a **regular grid** (one beat every `60/BPM` seconds) anchored to the first onset.
- That gives “every beat” in the segment even when only every 2nd onset is strong enough to detect.

### 6. Post-processing (advanced)

- If you have a list of “every 2nd beat” timestamps, you could interpolate missing beats (e.g. assume constant tempo between two detected beats and insert the missing ones). This is fragile if tempo changes a lot within the segment.

## Summary

- Use **per-range BPM** when running beat detection on segments.
- Prefer **onset** for variable-tempo songs; tune **min_gap** or use **onset + grid fill** if you get too few beats.
- Use **beats** with **lower tightness** and **per-segment BPM** when you want a strict grid and know the BPM per section.
