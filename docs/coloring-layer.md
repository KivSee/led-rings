# Coloring layer

The **coloring** layer is the required high-level layer of a song (see `song-sync.md` in the workspace `docs/` folder). It paints the colors that every other layer works on. A coloring layer is:

- a **layout** that splits the pixels into **1, 2, 3 or 4 groups** (see `layout.md`), and
- a **color for each group** (hue, saturation, brightness, each 0-1).

It is converted to proto effects in two steps: a **constant color per d1 ring**, then **position overlays** that change hue, saturation or brightness only where the layout puts a different group.

Songs assign coloring layers to sections of the song in whole bars (see the Song Sync tool, `ui/sync.html`, and `src/songs/<song>.layers.json`).

## Definition

```json
{
  "name": "sunset halves",
  "layout": { "groups": 2, "d2": "same", "d1": "d1 half: inner / outer" },
  "colors": [
    { "hue": 0.05, "sat": 1.0, "val": 1.0 },
    { "hue": 0.30, "sat": 1.0, "val": 0.5 }
  ]
}
```

- `layout` names a concrete layout from `layout.md`: a d2 layout (`same`, an alternate, square, triangle), a d1 layout (or none), and for combined layouts how they combine (`checker`, `accent in X`, or the 3 / 4 group split). The layout can be picked with the groups, balance and clustering parameters; the chosen result is what is stored.
- `colors` has one color per group, in group order: A, B, C, D. A color can instead be a **hue range**: add `hueEnd`, and the group's hue moves linearly from `hue` to `hueEnd` across the group's part (see "Hue ranges" below), for example `{ "hue": 0, "hueEnd": 0.2, "sat": 1, "val": 1 }`.

## Per d1 ring: a base group and at most one split

Every layout in `layout.md` resolves, for each d1 ring, into:

- a **base group**: the group the ring's pixels get where the position function is 0, and
- optionally an **other group** and the layout's **position function** `f` on its segment (`ind`, `centric`, `rand`, `arc` or `updown`), which is 0 for the base group and 1 for the other group.

| Layout | Base group of ring `r` | Split |
|---|---|---|
| d2 only (alternate, square, triangle) | the ring's d2 group | none |
| d1 only (d2 = same) | A | B, with the d1 function |
| combined, 3 groups | X rings: A. Y rings: C | X rings: B. Y rings: none |
| combined, 4 groups | X rings: A. Y rings: C | X rings: B. Y rings: D. Same d1 function |
| combined, 2 groups, checker | X rings: A. Y rings: B | X rings: B. Y rings: A (the inverted function, so A stays where f = 0 on X) |
| combined, 2 groups, accent in X | X rings: A. Y rings: A | X rings: B. Y rings: none |
| 1 group | A | none |

## Converting to effects

All effects of the layer use the section's time window (its bars, converted to beats and then to ms) and run in this order, before any other layer:

1. **`const_color`** on segment `all`, with the base group's color.
2. For a ring with a split, compare the other group's color with the base color, one channel at a time. **A channel that does not change gets no effect.** Usually only one channel changes (for example just the hue), so a split usually costs one extra effect.

The overlays reuse the layout's position function `f`, but its leaf values are replaced: where `f` is 0 (base group) the leaf becomes the "no change" value, and where `f` is 1 (other group) it becomes the amount of change for that channel. So the value used for the other group is not 1 but exactly what that channel needs.

| Channel | Base → other | Effect | Leaf where f = 0 | Leaf where f = 1 |
|---|---|---|---|---|
| hue | `h0` → `h1` | `position_hue` with `offset_factor` (added to the hue) | 0 | `Δh = h1 - h0`, taken the short way around the color wheel, and never making the hue negative (see Notes) |
| saturation | `s0` → `s1`, lower | `position_saturation` with `mult_factor_decrease` (multiplies) | 1 | `s1 / s0` |
| saturation | `s0` → `s1`, higher | `position_saturation` with `mult_factor_increase` (moves toward 1) | 0 | `(s1 - s0) / (1 - s0)` |
| brightness | `v0` → `v1`, lower | `position_brightness` with `mult_factor_decrease` | 1 | `v1 / v0` |
| brightness | `v0` → `v1`, higher | `position_brightness` with `mult_factor_increase` | 0 | `(v1 - v0) / (1 - v0)` |

### Hue ranges

A hue range makes a gradient instead of a single hue. It reuses the same idea: the layout's function `f` already hands each group's part its own 0-1 input (`half` gives each half 0-1, `repeat` gives each period 0-1), so putting a **`linear`** function in a group's leaf makes the hue move across exactly that part, for example across each outer half, or across each pair of pixels.

- `const_color` uses the base group's starting hue (`hue`).
- `position_hue` gets `f` with these leaves, all relative to the base group's starting hue `h0`:
  - base group: `0`, or `linear(0, hueEnd - h0)` if it is a range;
  - other group: `Δh`, or `linear(hue - h0, hueEnd - h0)` if it is a range.
- A ring without a split whose group is a range gets `position_hue` on segment **`all`** with `linear(0, hueEnd - hue)`: the gradient runs around the d1 ring, from small ring 0 to small ring 11.
- A range goes exactly from `hue` to `hueEnd`, not the short way around the color wheel; every hue it passes through stays between 0 and 1, so it never goes negative.

For example, "d0 batch 6" (`half(0, 1)` on `centric`) with A = hue 0.6 and B = a range from 0 to 0.2: `const_color` hue 0.6, and `position_hue.offset_factor` = `half(0, linear(-0.6, -0.4))`. Pixels 0-5 stay at 0.6, and pixels 6-11 go from hue 0 to 0.2.

The Song Sync drawer shows ranges this way: the **hue range (gradient)** checkbox per group, with "hue from" and "hue to" sliders.

### Example

Layout "d1 half: inner / outer" on segment `ind`, whose function is `half(half(0, 1), half(1, 0))`. Base A = `{ hue 0.05, sat 1, val 1 }`, other B = `{ hue 0.30, sat 1, val 0.5 }`.

- Hue changes by +0.25, saturation does not change, brightness halves. So each ring gets three effects: `const_color` with A, one `position_hue`, and one `position_brightness`. Saturation gets none.
- `position_hue.offset_factor` = `half(half(0, 0.25), half(0.25, 0))`
- `position_brightness.mult_factor_decrease` = `half(half(1, 0.5), half(0.5, 1))`

```json
[
  { "effect_config": { "start_time": 57440, "end_time": 64610, "segments": "all" },
    "const_color": { "color": { "hue": 0.05, "sat": 1.0, "val": 1.0 } } },
  { "effect_config": { "start_time": 57440, "end_time": 64610, "segments": "ind" },
    "position_hue": { "offset_factor": { "half": {
      "f1": { "half": { "f1": { "const_value": { "value": 0 } }, "f2": { "const_value": { "value": 0.25 } } } },
      "f2": { "half": { "f1": { "const_value": { "value": 0.25 } }, "f2": { "const_value": { "value": 0 } } } } } } } },
  { "effect_config": { "start_time": 57440, "end_time": 64610, "segments": "ind" },
    "position_brightness": { "mult_factor_decrease": { "half": {
      "f1": { "half": { "f1": { "const_value": { "value": 1 } }, "f2": { "const_value": { "value": 0.5 } } } },
      "f2": { "half": { "f1": { "const_value": { "value": 0.5 } }, "f2": { "const_value": { "value": 1 } } } } } } } }
]
```

The same list goes to every d1 ring that has this base group and split. Rings with a different base group get a different `const_color`, and rings without a split get only the `const_color`.

## Overrides

An **override** paints a different coloring layer over a few bars of a song, to highlight or point at a moment in the music, and then lets the section's own coloring come back. Overrides are stored next to the coloring sections in `src/songs/<song>.layers.json`:

```json
"coloring": {
  "layers": [ … ],
  "sections":  [{ "startBar": 16, "endBar": 37, "layer": "scattered warm" }],
  "overrides": [{ "startBar": 24, "endBar": 25, "layer": "white flash" }]
}
```

- An override may lie on top of a coloring section (that is the point), but overrides do not overlap each other.
- It uses any coloring layer, converted exactly as described above.
- **Rendering:** the base section's effects stay as they are, over the whole section. The override's effects come **after** them in the effect list, with the override's (shorter) time window. While the override runs, its `const_color` paints over everything the base section drew, and its own overlays apply on top. When its window ends, its effects stop, and the base section's effects, which never stopped, show again.
- Layers after the coloring (background, beat, notes, drop) still apply on top of the override, so a background like sparkles keeps running through it.

### Notes

- **Repeated rings.** With d2 layouts, rings in the same group get identical effects, so the effect list is built once per (base group, split) and sent to each of those rings.
- **Edge cases.** If the base color has `s0 = 1` or `v0 = 1`, there is no room to increase that channel, and if it is 0 there is nothing to multiply. Then the other group's channel cannot be reached from the base; swap which group is the base for that ring (invert `f`) so the overlay goes the other way.
- **Hue wrapping.** The renderer adds the offset to the hue, and the esp32 renderer wraps the result with `fmod(hue, 1)`. That wraps values above 1 but not below 0 (`fmod(-0.1, 1)` stays `-0.1`). So take `Δh` the short way around (0.95 → 0.05 is `+0.1`, not `-0.9`), and if `h0 + Δh` would be negative, add 1 to `Δh` (0.05 → 0.95 becomes `+0.9`, which lands on 0.95 after wrapping).
