import { als } from "../async-local-storage";
import { Effect, EffectConfig, Sequence } from "../effects/types";
import { SequencePerThing } from "../services/sequence";

interface EffectWithElements {
    effect: Effect;
    elements: number[];
}

export class Animation {

    private effects: EffectWithElements[] = [];

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
        als.run({ animation: this, effectConfig: emptyEffectConfig }, cb);
    }

    public addEffect(effect: Effect) {
        const store = als.getStore();
        this.effects.push({
            effect,
            elements: store.elements,
        });
    }

    public getSequence(): SequencePerThing {
        const seqPerThing: SequencePerThing = {};
        this.effects.forEach(effectWithElements => {
            effectWithElements.elements.forEach((element: number) => {
                const thingName = `ring${element}`;
                if (!seqPerThing[thingName]) {
                    seqPerThing[thingName] = {
                        effects: [],
                        duration_ms: this.totalTimeSeconds * 1000,
                        num_repeats: 0,
                    };
                }
                seqPerThing[thingName].effects.push(effectWithElements.effect);
            });
        });
        return seqPerThing;
    }

}
