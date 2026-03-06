# Overlapping brightness effects (fade over other effects)

## Expected behavior (UI preview)

When a **brightness-only** timeframe (e.g. Fade Out In) overlaps another timeframe that has hue/color (e.g. Hue Shift Sin), the preview composes them as:

- Base color and hue from the underlying timeframes.
- Brightness from each timeframe **multiplied**: `v *= brightness1 * brightness2 * …`

So the fade dims and restores **whatever color is already there** (the hue effect), not a separate layer color.

## Why the device can show something different

The runtime (sequence service / renderer) may treat each effect as a **layer** with its own base color:

- Layer 1: (color1 × hue) 
- Layer 2: (color2 × fade)  ← color2 is the timeframe’s color (e.g. red)

So you see “red fading” instead of “underlying hue fading”.

## What we do in the generator

For timeframes that have **only** brightness effects (fadeIn, fadeOut, fadeOutIn, blink, pulse, fade, brightness) and no hue/color effects, we **do not emit `constColor`** for that timeframe. So the sequence contains an effect with only `timed_brightness` (and `effect_config`), no `const_color`.

For the result to match the preview, the **renderer must**:

- When an effect has **no** `const_color` but has `timed_brightness` (or other brightness modifiers), treat it as: **multiply the current accumulated pixel value by this effect’s brightness**, instead of using a default layer color.

If the renderer does not yet support that, you may see black or a default during the fade until it is updated.
