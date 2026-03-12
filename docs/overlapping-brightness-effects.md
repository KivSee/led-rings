# Overlapping brightness effects (fade over other effects)

## No color vs color (user control)

Each timeframe has a **Color** field and a checkbox **"No color (modifiers only)"**. When the checkbox is checked:

- The timeframe does **not** contribute a base color (no `constColor` in the sequence).
- Timeline shows the bar in gray.
- Preview uses a neutral base; only this timeframe's effects (e.g. brightness, hue shift) apply on top of underlying layers.

So you choose per timeframe whether it adds color or only modifiers, independent of which effects are in the slots.

## Expected behavior (UI preview)

When a **no-color** timeframe (checkbox checked) overlaps another timeframe that contributes color, the preview composes them as:

- Base color and hue from the underlying timeframes.
- Brightness from each timeframe **multiplied**: `v *= brightness1 * brightness2 * …`

So the fade dims and restores **whatever color is already there**, not a separate layer color.

## Why the device can show something different

The runtime (sequence service / renderer) may treat each effect as a **layer** with its own base color:

- Layer 1: (color1 × hue) 
- Layer 2: (color2 × fade)  ← color2 is the timeframe’s color (e.g. red)

So you see “red fading” instead of “underlying hue fading”.

## What we do in the generator

For timeframes with **"No color (modifiers only)"** checked (`hasExplicitColor === false`), we **do not emit `constColor`**. The sequence contains the effect's modifiers (e.g. `timed_brightness`, `effect_config`) but no `const_color`.

For the result to match the preview, the **renderer must**:

- When an effect has **no** `const_color` but has `timed_brightness` (or other brightness modifiers), treat it as: **multiply the current accumulated pixel value by this effect’s brightness**, instead of using a default layer color.

If the renderer does not yet support that, you may see black or a default during the fade until it is updated.
