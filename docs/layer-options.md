# Layer options

The kinds of layers a song can use and what each one is for. For the details of each, follow the link in its section.

Layers, in the order their effects are applied to every d1 ring:

| Order | Lane | Role | Changes over time | Changes over space | Required |
|---|---|---|---|---|---|
| 1 | **coloring** | Paints the base colors. Everything else works on top of it. | no | can: one color everywhere, or a color that depends on the relPos in a segment (for example a hue going from X to Y along it) | yes |
| 2 | **override** | A coloring layer painted over a few bars of the base coloring, then the base comes back. | no | can, like the coloring | no |
| 3 | **texture** | Static decoration of the coloring: dots, hue variation, alternating darkness. | no | yes | no |
| 4 | **background** | A constant vibe that moves across the section (sparkles, slow breath), not synced to the beat. | yes, steadily, not with the beat | usually (sparkles); a slow breath is the same everywhere | no |
| 5 | **beat** | A visual that repeats in time with the beat. | yes, with the beat | yes | no |
| 6 | **notes** | Cues at specific moments in the song where something happens. | yes, at each cue | can | no |
| 7 | **motion** | Things moving: snakes, swells. | yes | yes | no |
| 8 | **transition** | Brings the scene in or takes it out by scaling brightness. Always last. | yes, over the section | some styles (rings one by one, build); a fade is the same everywhere | no |

## Coloring

Coloring is always the first layer, and it is required: a section with no coloring is dark. It is static in time but can change in space: it splits the pixels into groups and gives each group a color, and that picture holds for the whole section.

## Texture

Texture takes the coloring and makes it more interesting. Like the coloring, it is constant over time and only changes in space: it adds decorations or variation on top of the colors, for example a static dotted pattern, a smash of nearby hues, or alternating darker and brighter parts. It never sets the colors itself; it works with whatever the coloring painted.

## Background

Details: [background-layer.md](background-layer.md).

Background is something monotonic that adds a general vibe, like sparkles, confetti or a slow breath. It is not synced to beats or cues; it is just there, constantly, in the background of the section.

## Beat

Beat is a short visual that repeats many times, locked to the music: on every beat, on a group of a few beats, or on a longer cycle of beats. It is for parts with a steady, constant beat, and it should look good when repeated over and over. Unlike background, it follows the beat; unlike motion, its job is to mark the beat, not to carry something across the rings.

## Notes

Notes captures the moments in a song where things happen: a list of cues, each at its own time (a hit, an accent, a vocal entry, a stop). Unlike beat, the cues are not a regular repeating pattern; each one marks a specific point in the song, and the visual reacts at that moment.

## Motion

Details: [motion-layer.md](motion-layer.md).

Visible movement on top of the coloring and background.

## Transition

Details: [transition-layer.md](transition-layer.md).

Applied last and scales brightness only. The section is the length of the fade. A fade out should end where the scene underneath ends; otherwise the scene pops back on.
