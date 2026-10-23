# Background layer

The **background** layer is an optional high-level layer of a song (see `song-sync.md` in the workspace `docs/` folder). It gives a section its **feel**: a texture that stays the same all through the section and keeps the rings alive, without following the beat, the notes or the drop. Examples: sparkles, a pleasant gentle glitter, a constant flicker, a slow breathing, a soft wave drifting around the rings.

## What it does and does not do

- It works **on top of the coloring layer** (see `coloring-layer.md`). It never sets the base color. It only raises or lowers brightness (and sometimes nudges hue or saturation) of what the coloring painted, so the section keeps its colors.
- It is **monotonous**: the same pattern repeats for the whole section. Anything that should change with the music (on every beat, on a note, in the drop) belongs to the beat, notes or drop layers.
- It is **slow and continuous** compared to those layers. Its speed is a period in beats, independent of where the beats fall.
- It usually plays on a coloring that is not at full brightness (for example 0.2), so that it has room to light pixels up. A dim coloring plus an increasing background is the typical combination; the beat and drop layers then push brightness further.

## Definition

A background layer is a **recipe** with a few parameters, stored like a coloring layer and assigned to sections of the song in whole bars:

```json
{
  "name": "warm sparkles",
  "recipe": "sparkles",
  "intensity": 0.6,
  "period": 8,
  "density": 0.08,
  "rings": "all"
}
```

| Parameter | Meaning |
|---|---|
| `recipe` | Which feel, from the table below. |
| `intensity` | 0-1: how far the background moves the brightness away from the coloring. 0 does nothing. |
| `period` | Beats for one full cycle of the pattern. The pattern repeats every `period` beats for the whole section. |
| `density` | 0-1, for recipes that light a part of the pixels at a time: the share of pixels lit at once (the snake's `tail_length`). |
| `breath` | 0-1, optional: the density swings up and down by this share, like breathing (0 keeps it constant). |
| `breathBars` | Bars per breath (default 1). |
| `breathScatter` | 0-1, optional: how far apart in time the rings breathe. 0: all together. 1: each ring at its own time. |
| `mode` | `light` (default): raise brightness toward 1 (`mult_factor_increase`). `dark`: lower it (`mult_factor_decrease`), for dark sparkles or dips in a bright coloring. |
| `channel` | What the snake changes: `brightness` (default, `snake_brightness`) or `saturation` (`snake_saturation`, same fields). For saturation, `light` pushes pixels toward full color and `dark` pulls them toward white, which looks like glare. |
| `hueSwing` | For hue drift: how far the hue moves each way (+ and -), for example 0.1. |
| `hueShape` | For hue drift: `sin` (default) sways up and back down; `linear` ramps the hue from `-hueSwing` to `+hueSwing` over each cycle and jumps back (a sawtooth), using `offset_factor` = `linear(-hueSwing, +hueSwing)`; `rotate` turns the hue a full round every cycle with `offset_factor` = `linear(0, 1)`, seamless because hue 1 is hue 0 (the renderer wraps hues above 1); with ring phases, each ring starts at its own color: `linear(phase, 1 + phase)`. `linear` has no phase in the proto, so ring phases do not apply to `linear`; different per-ring cycles still keep the rings out of step. |
| `hueScatter` | For hue drift, 0-1: how far apart in time the rings sway. Ring `r` adds `frac(r × 0.618) × hueScatter` to the sin's `phase`, so neighbouring rings are never in step (a shimmering, sun-like surface instead of one pulse). Each ring then needs its own `timed_hue` effect. |
| `ringPhases` | For hue drift, optional: a random phase (0-1) for each of the 12 rings, used instead of the golden-ratio steps when the steps still look too regular. Picked once and stored, so the song plays the same every time. |
| `ringPeriods` / `ringSwings` | For hue drift, optional: a cycle length (beats) and a swing for each of the 12 rings, instead of the shared `period` and `hueSwing`. Each ring's `timed_hue` then has its own `repeat_num` = section beats / its cycle and its own `min` / `max`, so the rings drift against each other and the sway looks organic. Cycles that do not divide the section end mid-wave at the section end. |
| `rings` | Which d1 rings get it: `all`, or a 2-group d2 layout and a group (for example only the rings in group B of alternate 2 rings). The background cannot pick pixels inside a ring by group; inside a ring it always runs on its recipe's segment. |

## Recipes

| Recipe | Feel | Effect | Segment | Over time |
|---|---|---|---|---|
| **sparkles** | Single pixels flash up one after another, in random places. | `snake_brightness`, cyclic | `rand` | `head` moves 0 → 1 every `period` beats; `tail_length` = `density` (small, like 0.05-0.1). Each pixel lights up briefly when the window passes its random position. |
| **glitter** | A softer, pleasant shimmer: many pixels gently glowing up and down. | `snake_brightness`, cyclic | `rand` | Like sparkles with a larger `density` (0.2-0.4), a lower `intensity` (0.2-0.4) and a longer `period`. |
| **flicker** | A constant, nervous glitter. | two `snake_brightness`, cyclic | `rand` | Two sparkle snakes with different periods (for example `period` and `period × 0.62`), so the pattern never visibly repeats. Usually `mode: dark` with a small `intensity` on a bright coloring. |
| **breathing** | The whole section slowly breathes. | `timed_brightness` | `all` | `sin` between `1 - intensity` and 1 (dark mode) or between 0 and `intensity` (light mode), one cycle every `period` beats. |
| **wave** | A soft band of light drifts around each d1 ring. | `snake_brightness`, cyclic | `all` (around the ring) or `updown` (across, one direction in space) | `head` moves 0 → 1 every `period` beats; `tail_length` = `density` (0.2-0.5). |
| **hue drift** | The colors slowly sway around their hue, up and back down. | `timed_hue` | `all` | `offset_factor` = `sin(min -hueSwing, max +hueSwing, phase 0, repeats 1)`: starts at no shift, goes up by `hueSwing`, back, down by `hueSwing` and back, once every `period` beats (looped with `repeat_num`). The coloring underneath must stay at hue ≥ `hueSwing` at its lowest, or the swing makes it negative, which the esp32 renderer does not wrap; shift a range starting at 0 up by 1 (for example 0 → 0.15 becomes 1.0 → 1.15, the same colors). |

### Breathing density

With `breath`, the snake's `tail_length` is a `sin` instead of a constant:

```json
"tail_length": { "sin": { "min": density × (1 - breath), "max": density × (1 + breath), "phase": -0.25, "repeats": period / (4 × breathBars) } }
```

The renderer gives the snake's functions the position **within one cycle** of the effect (0-1 over `period` beats, set by `repeat_num`). So one breath per bar needs `repeats = period / 4`: with an 8-beat period, `repeats = 2`. Phase `-0.25` starts every breath at its smallest, so the sparkles thin out on each bar line and are densest mid-bar. The period should be a whole number of breaths (a multiple of `4 × breathBars` beats); otherwise every cycle cuts a breath short.

With `breathScatter`, each ring breathes at its own time so the rings do not pulse together: ring `r` adds `frac(r × 0.618) × breathScatter` to the sin's `phase` (in breaths). The golden-ratio steps scatter the offsets instead of putting neighbouring rings in sequence, which would look like a wave going around. For rings 4, 5, 6, 7 at full scatter the shifts are 0.47, 0.09, 0.71 and 0.33 of a breath. Each such ring then needs its own `tail_length` function, so rings no longer share one effect list.

The shape of a snake's light inside the window is its `mult_factor` function of the position inside the snake (0 at the tail, 1 at the head). For a soft flash that rises and falls, use `sin(min 0, max intensity, phase -0.25, repeats 1)`: it is 0 at both ends and `intensity` in the middle.

## Converting to effects

For each section that uses the background layer:

1. **Time window**: `start_time` / `end_time` of the section (bars → beats → ms), the same for every effect of the layer.
2. **Looping**: the pattern is written once for the range 0-1 and looped with the effect config: `repeat_num = section beats / period`, `repeat_start = 0`, `repeat_end = 1`. This is what `cycle(period, …)` does in a song.
3. **Order**: background effects come right after the coloring effects and before the beat, notes and drop layers, so those can still push brightness on top.
4. **Rings**: the effects go to every d1 ring selected by `rings`.

### Example: sparkles

`intensity` 0.6, `period` 8 beats, `density` 0.08, on a section of 60 beats (bars 1-15 at 4 beats per bar):

```json
{
  "effect_config": {
    "start_time": 96, "end_time": 26976, "segments": "rand",
    "repeat_num": 7.5, "repeat_start": 0, "repeat_end": 1
  },
  "snake_brightness": {
    "head": { "linear": { "start": 0, "end": 1 } },
    "tail_length": { "const_value": { "value": 0.08 } },
    "cyclic": true,
    "mult_factor_increase": { "sin": { "min": 0, "max": 0.6, "phase": -0.25, "repeats": 1 } }
  }
}
```

Every 8 beats the window runs once over all random positions, so each pixel of every ring flashes once per cycle, about 8% of the pixels at any moment, each rising toward full brightness and back.

## Notes

- **Room to light up.** In `light` mode the background pushes each pixel toward brightness 1 by `intensity`, so on a coloring at 0.2 a sparkle with intensity 0.6 reaches about 0.68. On a coloring already at 1 there is nothing to add; use `dark` mode instead.
- **Rings stay in sync.** All rings use the same `rand` segment, so the same pixel positions sparkle at the same moment on every ring. To break that, offset each ring's `head`: ring `r` gets `linear(o, 1 + o)` with `o = (r - 1) / 12`, so the rings run the same cycle shifted against each other. (The songs' `phase()` helper does not do this: for snakes it offsets the light shape, `mult_factor`, not `head`.)
- **Cost.** Each recipe is one effect per ring (two for flicker), whatever the section length, because the looping is done by the renderer.
