# Transition layer

The **transition** layer is an optional high-level layer of a song (see `song-sync.md` in the workspace `docs/` folder). It **introduces** a scene (brings it in) or **sunsets** it (takes it out): a fade in at the start of a part, a fade out at its end, or bringing the rings in step by step.

## What it does

- It works **on top of everything else**: coloring, background, beat, notes and drop. It only scales brightness, by a factor from 0 (dark) to 1 (unchanged), so whatever the other layers show is faded in or out as a whole.
- It changes over the length of its section: a transition section *is* the time the fade or the steps take. Put a fade in on the first bars of a part, and a fade out on its last bars.
- When the section ends, its effects stop and the scene shows at full brightness again. So a fade out should end where the scene underneath ends too (for example at the end of the coloring section); otherwise the scene pops back on.

## Definition

```json
{ "name": "slow fade in", "direction": "in", "style": "fade" }
```

| Parameter | Meaning |
|---|---|
| `direction` | `in`: from dark to the full scene. `out`: from the full scene to dark. |
| `style` | `fade`, `steps`, `rings` or `build` (below). |
| `steps` | For `steps`: how many brightness steps (2-16). |
| `order` | For `rings`: the order the d1 rings come in or go out: `clockwise` (from ring 1), `bottom-up`, or `scattered`. For `build`, also `alternate` (ring by ring: group = (ring − 1) mod groups). |
| `groups` | For `build`: how many groups of rings come in, one stage each. |
| `level` | For `build`: the absolute brightness (0-1) the groups come in at. |
| `pump` | For `build`: add a last stage where every ring jumps to full brightness. |

## Styles

| Style | Look | Effect |
|---|---|---|
| **fade** | A smooth fade. | `timed_brightness` with `mult_factor_decrease` = `linear(0, 1)` for in, `linear(1, 0)` for out, segment `all`, on every ring. |
| **steps** | Brightness jumps up (or down) in a few clear steps, like stairs. | `timed_brightness` with `mult_factor_decrease` = `steps(num_steps: N, first_step_value: 0, diff_per_step: 1 / (N - 1))` for in; `first_step_value: 1, diff_per_step: -1 / (N - 1)` for out. The first step is dark (in) or the last step is dark (out). |
| **rings** | The d1 rings switch on one after another (in), or off one after another (out). | Per ring, a `timed_brightness` with `mult_factor_decrease` = `const_value 0` (dark) on part of the section. For in, ring number `k` in the order (0-11) is dark from the section start until `k / 12` of it; for out, it is dark from `(k + 1) / 12` of the section to its end. |
| **build** | Groups of rings come in one stage at a time at a set brightness, then (with `pump`) everything jumps to full brightness on the last stage. | The section is split into equal stages: one per group, plus the pump. Per ring and stage, one `timed_brightness` with a `const_value` factor and a stage-long time window: `mult_factor_decrease` `0` before the ring's group has come in; toward `level`; and in the pump stage `mult_factor_increase` `1` (full brightness). |

**build reaches absolute brightness.** Unlike the other styles, `build` sets brightness levels instead of only scaling: a level above the coloring's brightness `v` uses `mult_factor_increase` `(level − v) / (1 − v)`, a level below it uses `mult_factor_decrease` `level / v`. `v` is the brightness of the coloring section underneath. For example, on a coloring at 0.2, level 0.3 is `mult_factor_increase 0.125` and the pump is `mult_factor_increase 1`. On a 1-bar section with 3 groups and the pump, every stage is one beat.

Ring orders:

- **clockwise**: rings 1, 2, …, 12 (around the clock from 1:30).
- **bottom-up**: the bottom rings first (5, 6, then 4, 7, …), the top rings last (11, 12): the scene rises like a sunrise. For out, the same order, so the bottom goes dark first.
- **scattered**: a fixed, mixed order (golden-ratio steps), so neighbouring rings do not follow each other.

## Converting to effects

1. **Time window**: `start_time` / `end_time` of the transition section (bars → beats → ms). For `rings`, each ring's dark part is a shorter window inside it.
2. **Order**: transition effects go **last** in every ring's effect list, after the coloring, background, beat, notes and drop effects, so they scale the final result.
3. `mult_factor_decrease` multiplies brightness, so a factor of 1 leaves the scene as it is and 0 turns it off.

### Example: a 2-bar fade in

On bars 1-2 of shemesh (beats 0-8, about 96-3680 ms):

```json
{
  "effect_config": { "start_time": 96, "end_time": 3680, "segments": "all" },
  "timed_brightness": { "mult_factor_decrease": { "linear": { "start": 0, "end": 1 } } }
}
```

## In the Song Sync tool

The **Transitions** lane (below the background lane) holds transition sections, snapped to bars like the other lanes. Each section uses a transition layer, edited in the drawer (direction, style, steps, order). The simulation applies the transition on top of everything while the song plays.
