# LED rings: notes for agents

## Pipeline
Song TS (`src/songs/<name>.ts`, generated from `<name>.json` by the editor) → JSON → led-sequence-service (Pi, 10.0.1.200:8082)
→ protobuf → ESP32 rings (kivsee-render). The C++ renderer applies effects in order: later effects overwrite earlier ones.
`ui/src/player/render.ts` (Sequence Player) matches the renderer exactly; trust it over the editor's effect preview.

## Safety
- Running `src/songs/*.ts` PUTs to the real sequence service on the Pi. Ask before sending anything to the Pi.
  To compile locally: `npx ts-node src/export-sequence.ts src/songs/<name>.ts [out.json]`. This writes
  `ui/public/<name>.sequence.json` for the player at `http://localhost:5173/player.html?song=<name>`.
- Commit or push only when asked.
- Don't use reference song names (e.g. "jaguar") in labels or ids.

## Section-by-section workflow (Section Lab)
Sections are designed one at a time in the Section Lab (`ui/lab.html`, `ui/src/lab/main.ts`). The shared builder is
`src/lab/sectionLab.ts`, which runs in the song runtime too, so keep it ES2016.
Example: `http://localhost:5173/lab.html?song=inequal&name=chase&from=280&to=392&set=chase&marks=312,344,384`
(`marks` = inner sections; without them the lab uses the ones it saved in localStorage).
- A song section is a marker timeframe with a `labSection` field (a SectionSpec recipe). The generated TS calls
  `labSection(anim, from, to, spec)`, and the effects are built when the song runs. The recipe is the whole
  section; nothing else is stored. The lab's "Copy for song" button gives the spec.
- SectionSpec: palette, mix (options taking turns every `barsEach` bars, each with timing/palette), transition,
  shape (base, build-up, fade-out, peak, pace, overlays per inner section, `parts` = shape per inner section),
  blocks (fixed options at given beats, each with its own transition), shuffleColors.
- Transitions: blends (cut, blend-bar, blend-2, dip) and 2-beat markers centred on the switch (streak, streak-in,
  black, flash, strobe, spin, rainbow). A block edge uses the arriving block's transition, else the leaving block's,
  else the mix's. blend-bar is the expensive one (~20 effects per edge); markers cost 1–2.
- Lab BAR = 4 beats. On a full base color, brightness increases are invisible: patterns dim first (dimAll), and
  flashes go toward white through saturation.
- Check UI changes in a real browser (headless Chrome over CDP, take a screenshot); typecheck and logic tests
  missed broken CSS before.

## Ring limits
- Rings decode the sequence recursively. Build 132 of esp32-animations (branch `fix/decode-stack`) has a 32 KB
  decode stack; rings 1, 4, 7, 11, 12 still run the old 8 KB build and may crash on deep nesting.
  `sendSequence` refuses nesting > 20 float functions. Memory isn't the limit (~1,300 effects fit in internal RAM).
- Keep the effect count per ring reasonable: inequal is ~293 per ring (Chase 280–392 ≈ 101 of them).
- The firmware lights LEDs at val² (0.07 brightness ≈ off). Never put `phase` on raw snake_brightness/saturation:
  it shifts the amounts (factors > 1 → purple on LEDs while the sim looks fine).

## inequal (branch `inequal`)
- 100 BPM, 4-beat bars, startOffsetMs 0. Beat numbers in conversation are the 100 BPM ones (git history before
  2026-10-28 counts at 150 BPM, ×1.5).
- Section map: intro 0–48 · B1 48–96 · Rebuild 96–144 · Drift 149.33–183.33 · drum rotation from 181.33 ·
  Shimmer 183.33–216 · starry middle 216–280 (lab section) · Chase 280–392 (lab section: Night sky, 7 four-bar
  blocks, build-up 280–312, fade-out 384–392) · Finale 392–504 · Outro 504–520.
- Next: the Finale 392–504, section by section in the lab.
- Audio `ui/public/inequal.wav` is gitignored; copy it over to hear the song in the editor, lab and player.
- Merging main into inequal conflicts only in `ui/vite.config.ts` (plugins and page entries on both sides).

## Dev server
`ui/vite.config.ts` has a `quiet-song-saves` plugin: saving `src/songs/*.json` must not full-reload the open pages
(the editor's Send to LEDs would reload itself). Pages read songs when they load; reload them to see a save.
