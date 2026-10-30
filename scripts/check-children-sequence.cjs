// Run after export: node scripts/check-children-sequence.cjs
require('ts-node').register({ transpileOnly: true, moduleTypes: { 'ui/**/*.ts': 'cjs' } });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderRing, missingSegments } = require('../ui/src/player/render.ts');
const { nestingDepth, functionCount } = require('../src/effects/compact.ts');
const exported = JSON.parse(fs.readFileSync(path.join(__dirname, '../ui/public/children.sequence.json')));
const sequence = exported.sequence;

function render(part, time) {
  const pixels = Array.from({ length: 144 }, () => ({ hue: 0, sat: 0, val: 0 }));
  renderRing(part, time, pixels);
  return pixels;
}

assert.equal(Object.keys(sequence).length, 12);
assert.deepEqual(missingSegments(sequence), []);
assert.equal(exported.midiNotes.length, 1327);
let checks = 0;
for (const [name, part] of Object.entries(sequence)) {
  assert(part.effects.length < 1000, `${name} exceeds the effect budget`);
  assert(Math.max(...part.effects.map(nestingDepth)) <= 10, `${name} exceeds the nesting budget`);
  assert(functionCount(part) <= 3500, `${name} exceeds the function allocation budget`);
  assert.equal(part.num_repeats, 1);
  assert.equal(part.duration_ms, 243647);
  for (const time of [243647, 244000]) {
    assert(render(part, time).every(pixel => pixel.val === 0), `${name} must finish black`);
  }

  // Check the beat beneath the independent piano/drum overlays.
  const confetti = {
    ...part,
    effects: part.effects.filter(({ effect_config: c }) =>
      c.segments === 'all' && c.start_time >= 210000 && c.end_time <= 238415),
  };
  assert(confetti.effects.some(effect => effect.effect_config.repeat_num > 1), 'Shuffle must use native cycles');
  const anchor = 43.908322493, period = 0.438021742;
  for (let beat = Math.ceil((210 - anchor) / period); anchor + (beat + 0.5) * period < 238.415; beat++) {
    const time = anchor + beat * period;
    const crest = render(confetti, time * 1000);
    const trough = render(confetti, (time + period / 2) * 1000);
    const sparks = crest.filter(pixel => pixel.val > (time < 224.118 ? 0.85 : 0.43) && pixel.sat > 0.9).length;
    assert(time < 224.118 ? sparks === 6 : sparks >= 18 && sparks <= 36, `${name}: wrong spark count at ${time}`);
    assert(trough.every(pixel => pixel.val < 0.092), `${name}: offbeat must remain gentle`);
    checks++;
  }
}
console.log(`PASS: controller limits, segments, MIDI, ending, and ${checks} confetti beat checks`);

// Repeated synth carriers must still hit the extracted quad onsets.
const { SYNTH_NOTES } = require('../src/songs/children-accents.ts');
const { effectRelTime } = require('../ui/src/player/render.ts');
const ringOrder = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const inner = [11, 10, 9, 8];
for (const note of SYNTH_NOTES) {
  const part = sequence[`ring${ringOrder[note.quad % 12]}`];
  const at = (note.startSeconds + note.endSeconds) * 500;
  assert(part.effects.some(e => e.const_color?.color.hue === 0.76
    && e.effect_config.segments === String(inner[note.step])
    && effectRelTime(e.effect_config, at) !== undefined), `Missing synth quad at ${at}`);
}
console.log(`PASS: ${SYNTH_NOTES.length} synth note timings retained by native repeats`);

// Sample the full recording to catch invalid values or effects that leak past
// their intended intervals after replacing sampled trees with carriers.
for (const [name, part] of Object.entries(sequence)) for (let time = 0.37; time < part.duration_ms; time += 251) {
  assert(render(part, time).every(p => Number.isFinite(p.hue) && Number.isFinite(p.sat)
    && Number.isFinite(p.val) && p.val >= 0 && p.val <= 1.001 && p.sat >= 0 && p.sat <= 1.001),
  `${name}: invalid rendered channel at ${time}`);
}
console.log('PASS: finite, bounded rendered channels throughout the full recording');

// Optional post-deployment verification of actual bytes sent to controllers.
// CHILDREN_PI_URL=http://10.0.1.200:8082 node scripts/check-children-sequence.cjs
if (process.env.CHILDREN_PI_URL) (async () => {
  const base = process.env.CHILDREN_PI_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/triggers/children`);
  assert(response.ok);
  assert.deepEqual(await response.json(), sequence, 'Pi must serve this exact export');
  for (const name of Object.keys(sequence)) {
    const response = await fetch(`${base}/triggers/children/objects/${name}`, { headers: { Accept: 'application/x-protobuf' } });
    assert(response.ok);
    const bytes = (await response.arrayBuffer()).byteLength;
    assert(bytes > 0 && bytes < 50000, `${name}: ${bytes} bytes exceeds the 50 KB hardware budget`);
    console.log(`${name}: ${bytes} controller bytes`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
