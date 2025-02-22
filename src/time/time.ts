import { als } from "../async-local-storage";

const beatToMs = (beat: number, bpm: number) => {
    return beat * 60 / bpm * 1000;
}

export const beats = (startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm, startOffsetMs } = store.animation;
    const startTime = Math.round(beatToMs(startBeat, bpm)) + startOffsetMs;
    const endTime = Math.round(beatToMs(endBeat, bpm)) + startOffsetMs;
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
        }
    }
    als.run(newStore, cb);
}