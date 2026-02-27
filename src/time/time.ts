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
    const startTime = Math.round(beatToMs(startBeat, bpm, beatTimestampsMs)) + startOffsetMs;
    const endTime = Math.round(beatToMs(endBeat, bpm, beatTimestampsMs)) + startOffsetMs;
    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            start_time: startTime,
            end_time: endTime,
        }
    }
    als.run(newStore, cb);
}

export const cycle = (beatsInCycle: number, cb: Function) => {
    return cycleBeats(beatsInCycle, 0, beatsInCycle, cb);
}

export const cycleBeats = (beatsInCycle: number, startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm } = store.animation;
    const totalBeats = (store.effectConfig.end_time - store.effectConfig.start_time) / 1000 / 60 * bpm;
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
