import { als } from "../async-local-storage";
import { isRecordingMode } from "../effects/effect";

/**
 * Convert a beat number to milliseconds.
 * When beatTimestampsMs is available, uses lookup with linear interpolation
 * for fractional beats. Falls back to fixed-BPM formula otherwise.
 */
const beatToMs = (beat: number, bpm: number, beatTimestampsMs?: number[]): number => {
    if (!beatTimestampsMs || beatTimestampsMs.length === 0) {
        return beat * 60 / bpm * 1000;
    }

    const maxIndex = beatTimestampsMs.length - 1;

    if (beat <= 0) return beatTimestampsMs[0] ?? 0;
    if (beat >= maxIndex) {
        // Extrapolate beyond detected beats using average beat duration
        const lastMs = beatTimestampsMs[maxIndex];
        const avgBeatMs = maxIndex > 0 ? lastMs / maxIndex : 60 / bpm * 1000;
        return lastMs + (beat - maxIndex) * avgBeatMs;
    }

    // Integer beat: direct lookup
    const floor = Math.floor(beat);
    const ceil = Math.ceil(beat);
    if (floor === ceil) return beatTimestampsMs[floor];

    // Fractional beat: linear interpolation between adjacent detected beats
    const frac = beat - floor;
    return beatTimestampsMs[floor] + frac * (beatTimestampsMs[ceil] - beatTimestampsMs[floor]);
}

export const beats = (startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm, startOffsetMs, beatTimestampsMs } = store.animation;
    // When beatTimestampsMs is present, timestamps are absolute positions in the audio — no offset needed.
    // startOffsetMs is only used for the BPM-based fallback in beatToMs.
    const offset = (beatTimestampsMs && beatTimestampsMs.length > 0) ? 0 : startOffsetMs;
    const startTime = Math.round(beatToMs(startBeat, bpm, beatTimestampsMs)) + offset;
    const endTime = Math.round(beatToMs(endBeat, bpm, beatTimestampsMs)) + offset;
    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            start_time: startTime,
            end_time: endTime,
        },
        sectionBeats: endBeat - startBeat,
        sectionStartBeat: startBeat,
    }
    als.run(newStore, cb);
}

/**
 * A named part of the song from `start` to `end` (beats). It can fade in for `fadeIn` beats before `start` and fade
 * out for `fadeOut` beats after `end`, overlapping the sections around it. Runs cb inside beats() over the whole
 * span, fades included, and records the section so tools like the Sequence Player can show which one is playing.
 */
export const section = (name: string, span: { start: number; end: number; fadeIn?: number; fadeOut?: number }, cb: Function) => {
    const { start, end, fadeIn = 0, fadeOut = 0 } = span;
    als.getStore().animation.sections.push({ name, startBeat: start, endBeat: end, fadeInBeats: fadeIn, fadeOutBeats: fadeOut });
    beats(start - fadeIn, end + fadeOut, cb);
}

export const cycle = (beatsInCycle: number, cb: Function) => {
    return cycleBeats(beatsInCycle, 0, beatsInCycle, cb);
}

// ---------------------------------------------------------------------------
// Tempo-following cycles
// ---------------------------------------------------------------------------
// The renderer spreads an effect's repeat_num cycles evenly over its
// start..end milliseconds, while the UI (and the music) count cycles in beats.
// When the tempo changes inside a section the two drift apart: on the loop song
// a 64-beat cycle drifted by up to half a cycle. So with beat timestamps, a
// cycled section is emitted as consecutive chunks that each start on a cycle
// boundary at its real time; consecutive cycles stay in one chunk while the
// evenly spaced version stays within cycleDriftTolerance() of the beat
// positions. A steady-tempo section stays a single effect, as before.

/** Allowed drift of the cycle position, in beats: 10% of a cycle, kept within 0.1..1 beat. */
const cycleDriftTolerance = (beatsInCycle: number) => Math.min(1, Math.max(0.1, 0.1 * beatsInCycle));

/** Worst drift (beats) if [a, b] is one effect, checked at every cycle boundary and mid-cycle. */
const chunkDrift = (a: number, b: number, beatsInCycle: number, toMs: (beat: number) => number): number => {
    const msA = Math.round(toMs(a));
    const msB = Math.round(toMs(b));
    if (msB <= msA) return 0;
    const cycles = (b - a) / beatsInCycle;
    let worst = 0;
    for (let x = a + beatsInCycle / 2; x < b; x += beatsInCycle / 2) {
        const hwCycles = (toMs(x) - msA) / (msB - msA) * cycles;  // renderer's cycle position
        const uiCycles = (x - a) / beatsInCycle;                 // beat-counted position
        worst = Math.max(worst, Math.abs(hwCycles - uiCycles) * beatsInCycle);
    }
    return worst;
}

/** Split [start, end] into chunks on cycle boundaries, each as long as its drift allows. */
const tempoChunks = (start: number, end: number, beatsInCycle: number, toMs: (beat: number) => number): Array<[number, number]> => {
    const boundaries: number[] = [];
    for (let k = 0; start + k * beatsInCycle < end - 1e-9; k++) boundaries.push(start + k * beatsInCycle);
    boundaries.push(end);
    const tolerance = cycleDriftTolerance(beatsInCycle);
    const chunks: Array<[number, number]> = [];
    let i = 0;
    while (i < boundaries.length - 1) {
        let j = i + 1;
        while (j + 1 < boundaries.length && chunkDrift(boundaries[i], boundaries[j + 1], beatsInCycle, toMs) <= tolerance) j++;
        chunks.push([boundaries[i], boundaries[j]]);
        i = j;
    }
    return chunks;
}

export const cycleBeats = (beatsInCycle: number, startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm, beatTimestampsMs } = store.animation;
    const totalBeats = store.sectionBeats ??
        ((store.effectConfig.end_time - store.effectConfig.start_time) / 1000 / 60 * store.animation.bpm);

    const runChunk = (chunkStore: any, chunkBeats: number) => {
        const newStore = {
            ...chunkStore,
            effectConfig: {
                ...chunkStore.effectConfig,
                repeat_num: chunkBeats / beatsInCycle,
                repeat_start: startBeat / beatsInCycle,
                repeat_end: endBeat / beatsInCycle,
            },
            cycleStack: [...(store.cycleStack || []), { beatsInCycle, startBeat, endBeat }],
        }
        als.run(newStore, cb);
    };

    // Split only for real sequences: with beat timestamps, inside a beats()
    // section, not nested in another cycle, and never while recording a song
    // back into timeframes (the UI import), which expects one timeframe.
    const canSplit = beatTimestampsMs && beatTimestampsMs.length > 1 &&
        store.sectionStartBeat !== undefined && store.sectionBeats !== undefined &&
        !(store.cycleStack && store.cycleStack.length) && !isRecordingMode();
    if (canSplit) {
        const toMs = (beat: number) => beatToMs(beat, bpm, beatTimestampsMs);
        const sectionStart: number = store.sectionStartBeat;
        const chunks = tempoChunks(sectionStart, sectionStart + totalBeats, beatsInCycle, toMs);
        if (chunks.length > 1) {
            for (const [a, b] of chunks) {
                runChunk({
                    ...store,
                    effectConfig: {
                        ...store.effectConfig,
                        start_time: Math.round(toMs(a)),
                        end_time: Math.round(toMs(b)),
                    },
                    sectionBeats: b - a,
                    sectionStartBeat: a,
                }, b - a);
            }
            return;
        }
    }
    runChunk(store, totalBeats);
}
