import { als } from "../async-local-storage";

const beatToMs = (beat: number, bpm: number) => {
    return beat * 60 / bpm * 1000;
}

export const beats = (startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm } = store.animation;
    const startTime = beatToMs(startBeat, bpm);
    const endTime = beatToMs(endBeat, bpm);
    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            start_time: startTime,
            end_time: endTime
        }
    }
    als.run(newStore, cb);
}