# Motion layer

The **motion** layer is an optional high-level layer of a song (see `song-sync.md` in the workspace `docs/` folder). It adds **movement**: things that travel across the rings over time, mostly **snakes** (a lit window moving along a segment). Where the background layer is a steady texture, motion is a visible shape going somewhere: rays shooting out of the center, a band running around a ring, a sweep from one side to the other.

## What it does

- Each motion section runs one or more snakes on a segment, per d1 ring. The segment decides the direction: `rad` goes from the inner side of the installation to the outer side (rays out of the center), `all` goes around each d1 ring, `updown` sweeps one way in space, `centric` runs around every small ring at once.
- A snake can draw in two ways:
  - **glow** (default): the snake *adds* light on top of the scene (`snake_brightness` with `mult_factor_increase`). The coloring underneath stays visible; the snake is a bright streak over it.
  - **mask**: only the snake is lit (`snake`). Pixels outside it go dark, so the scene shows only through the moving snake. The renderer's `snake` multiplies every pixel outside the snake by 0.
- Motion comes after the coloring and background, and before transitions, which scale the final result.

## Definition

```json
{
  "name": "sun rays",
  "recipe": "shoot",
  "segment": "rad",
  "draw": "glow",
  "rings": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "period": 2, "tail": 0.3, "delay": 0.3, "intensity": 0.8,
  "ringParams": [{ "period": 2.4, "tail": 0.31, "delay": 0.12, "intensity": 0.74 }, …]
}
```

| Parameter | Meaning |
|---|---|
| `recipe` | `shoot`: one snake per cycle travels the segment from start (relPos 0) to end (1) and leaves. `swell`: the whole ring brightens and fades back on a sin, once per cycle: `timed_brightness` with `mult_factor_increase` = `sin(min 0, max intensity, phase -0.25 + ring phase, repeats 1)` on segment `all`. With a ring phase, the swell moves across the installation at the scale of whole rings. |
| `segment` | The segment the snake runs on, which sets its direction (`rad`, `all`, `updown`, `centric`). |
| `draw` | `glow` (light on top) or `mask` (only the snake lit). |
| `period` | Beats per cycle: one snake each cycle. |
| `tail` | Snake length, as a share of the segment (0-1). |
| `delay` | Share of each cycle before the snake enters, so the cycle has a pause. Different delays per ring stagger the rings. |
| `intensity` | For glow: how far the snake pushes brightness toward 1 at its head. |
| `headShape` | How the head moves each cycle: `linear` (default) shoots from the start to the end and leaves; `sin` grows the snake out to the end and pulls it back in, smoothly, with `head` = `sin(min 0, max 1, phase -0.25, repeats 1)` (phase -0.25 starts each cycle at the start of the segment). Without per-ring parameters, every ring moves exactly together. |
| `ringPhase` | For the `sin` head: `around` shifts ring `r` by `(r - 1) / 12` of a cycle (`phase` = `-0.25 + (r - 1) / 12`), so the peak travels clockwise from ring to ring and the 12 rings combine into one motion around the circle. With `tail` 1 the lit part always reaches back to the start of the segment, so on `rad` it is a bar growing out from the center and shrinking back.; `around2` shifts by `2 (r - 1) / 12`, so two opposite waves travel around.; `across` shifts by the ring's left-to-right position (`(1 - (sin(angle) + 1) / 2) × 0.7`, ring `r` at clock angle `(r + 0.5) × 30°`), so the left side peaks first and the right side 0.7 of a cycle later (the rest of the cycle lets the right fade before the left rises again): one wash of light crossing the whole installation. |
| `ringParams` | Optional: `period`, `tail`, `delay`, `intensity` and `startOffset` for each of the 12 rings (index 0 is ring 1), so the rings do not move together. |
| `startOffset` | Beats after the section start before a ring's snakes begin. Every ring still ends with the section, so they all stop together but do not start in sync. |

## Converting to effects

One effect per ring (each ring has its own parameters), with the section's time window and `segments` = `segment`:

- **Looping**: `repeat_num` = section beats / `period`, `repeat_start` 0, `repeat_end` 1.
- **Start offset**: a ring with `startOffset` gets `start_time` = section start + `startOffset` beats (in ms) and keeps the section's `end_time`, with `repeat_num` = (section beats − `startOffset`) / `period`.
- **head**: `linear(-delay, 1 + tail)`. The head starts `delay` before the segment (unseen), crosses it, and stops once the tail has left past the end, so each snake enters and leaves fully. Not cyclic.
- **tail_length**: `const_value tail`.
- **glow**: `snake_brightness` with `mult_factor_increase` = `linear(0, intensity)`: 0 at the tail end, `intensity` at the head, so the streak is brightest at its front and fades behind.
- **mask**: `snake` with the same `head` and `tail_length`. Its brightness rises from 0 at the tail to 1 at the head, and everything outside it is dark.

### Example: one ring of sun rays

Ring 1, period 2.4 beats, tail 0.31, delay 0.12, intensity 0.74, on a 4-bar (16-beat) section:

```json
{
  "effect_config": { "start_time": 116390, "end_time": 123560, "segments": "rad",
                     "repeat_num": 6.667, "repeat_start": 0, "repeat_end": 1 },
  "snake_brightness": {
    "head": { "linear": { "start": -0.12, "end": 1.31 } },
    "tail_length": { "const_value": { "value": 0.31 } },
    "cyclic": false,
    "mult_factor_increase": { "linear": { "start": 0, "end": 0.74 } }
  }
}
```

## In the Song Sync tool

The **Motion** lane (between the background and transitions lanes) holds motion sections, snapped to bars. The drawer sets the recipe, segment, draw mode, rings and the shared parameters, and **Vary per ring** rolls random per-ring parameters. The simulation animates the snakes on top of the coloring and background.
