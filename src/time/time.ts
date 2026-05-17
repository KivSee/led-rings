import { als } from "../async-local-storage";

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
    }
    als.run(newStore, cb);
}

export const cycle = (beatsInCycle: number, cb: Function) => {
    return cycleBeats(beatsInCycle, 0, beatsInCycle, cb);
}

export const cycleBeats = (beatsInCycle: number, startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const totalBeats = store.sectionBeats ??
        ((store.effectConfig.end_time - store.effectConfig.start_time) / 1000 / 60 * store.animation.bpm);
    const repeatNum = totalBeats / beatsInCycle;

    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            repeat_num: repeatNum,
            repeat_start: startBeat / beatsInCycle,
            repeat_end: endBeat / beatsInCycle,
        },
        cycleStack: [...(store.cycleStack || []), { beatsInCycle, startBeat, endBeat }],
    }
    als.run(newStore, cb);
}
