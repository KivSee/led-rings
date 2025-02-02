import { als } from "../async-local-storage";
import { Effect, EffectConfig, Sequence } from "../effects/types";

export class Animation {

    private effects: Effect[] = [];

    constructor(
        public name: string,
        public bpm: number,
        public totalTimeSeconds: number,
        public startOffsetSeconds: number = 0
    ) { }

    public sync(cb: Function) {
        const emptyEffectConfig: Partial<EffectConfig> = {
            segments: "all",
        };
        als.run({animation: this, effectConfig: emptyEffectConfig}, cb);
    }

    public addEffect(effect: Effect) {
        this.effects.push(effect);
    }

    public getSequence(): Sequence {
        return {
            effects: this.effects,
            duration_ms: this.totalTimeSeconds * 1000,
            num_repeats: 0,
        }
    }

}
