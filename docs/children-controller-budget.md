# Children controller budget

Measured from repository song exports on 2026-10-30. Binary sizes use the Pi's
actual `AnimationProto` encoder; JSON sizes are not controller payload sizes.

| Sync | Effects per ring | Function nodes per ring | Maximum JSON nesting | Binary bytes per ring |
| --- | ---: | ---: | ---: | ---: |
| buttons | 166–170 | 216–217 | 6 | 6,853–7,025 |
| loop | 237–277 | 252–290 | 6 | 9,882–11,360 |
| shemesh | 158–188 | 326–411 | 10 | 6,869–8,236 |
| inequal | 23–27 | 23–29 | 6 | 956–1,081 |
| Children, previous compressed version | 672–995 | 14,103–29,787 | 14 | 135,832–288,166 |
| Children, shallow carriers | 482–789 | 2,044–3,160 | 10 | 30,774–48,546 |

The previous compression satisfied the effect-count limit but left thousands of
allocated function nodes inside those effects. Sampled envelopes, sampled green
wave carriers, and nested sums of flicker windows dominated the payload.
Controller heap exhaustion or recursive decoding stack exhaustion is therefore
plausible. No controller serial reset/backtrace was captured, so this is an
inference, not a confirmed reset cause. Successful Pi conversion and HTTP delivery
do not prove that a physical ring decoded or rendered a sequence.

The shallow version uses native effect repeats for green-wave carriers, synth
quad returns, flicker textures, and confetti. Most envelope paths have at most two
half-function levels. The depth-10 cap counts every JSON container, including the
effect and channel wrappers. Export also checks fewer than 1,000 effects and no
more than 3,500 function nodes per controller.

Compression is deliberately lossy: envelopes use at most five control points;
synth levels are averaged within each recurring run; flickers use a sixteenth-note
carrier with a phrase-wide crescendo; confetti uses a one-beat shuffle loop.
Piano/guitar onset and duration configs, MIDI transcription, section metadata,
and the final black endpoint are retained. All 640 synth-note midpoints are
checked against the repeated carriers, along with 768 confetti beat checks and
finite channel values sampled throughout the recording.

Validation:

```sh
LEDS_OBJECT_SERVICE_IP=127.0.0.1 SEQUENCE_SERVICE_IP=127.0.0.1 TRIGGER_SERVICE_IP=127.0.0.1 yarn ts-node src/export-sequence.ts src/songs/children.ts
node scripts/check-children-sequence.cjs
# After deploying, verifies exact readback and a <50,000-byte cap per ring:
CHILDREN_PI_URL=http://10.0.1.200:8082 node scripts/check-children-sequence.cjs
```
