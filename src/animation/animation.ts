import { als } from "../async-local-storage";
import { Effect, EffectConfig, Sequence } from "../effects/types";
import { SequencePerThing } from "../services/sequence";

/** Add a constant offset to a FloatFunction value. */
function offsetFloatFunction(ff: any, offset: number): any {
    if (!ff || typeof ff !== 'object') return ff;
    const r = JSON.parse(JSON.stringify(ff));
    if (r.const_value) r.const_value.value = (r.const_value.value ?? 0) + offset;
    else if (r.linear) { r.linear.start += offset; r.linear.end += offset; }
    else if (r.sin) { r.sin.min += offset; r.sin.max += offset; }
    else if (r.steps) r.steps.first_step_value = (r.steps.first_step_value ?? 0) + offset;
    else if (r.repeat) r.funcToRepeat = offsetFloatFunction(r.funcToRepeat, offset);
    else if (r.half) { r.f1 = offsetFloatFunction(r.f1, offset); r.f2 = offsetFloatFunction(r.f2, offset); }
    else if (r.comb2) { r.f1 = offsetFloatFunction(r.f1, offset); r.f2 = offsetFloatFunction(r.f2, offset); }
    return r;
}

/** Effect keys whose leading characteristic can be phase-offset, mapped to the FloatFunction field(s). */
const PHASE_FIELDS: Record<string, string[]> = {
    timed_hue: ['offset_factor'],
    position_hue: ['offset_factor'],
    snake_hue: ['offset_factor'],
    timed_brightness: ['mult_factor_increase', 'mult_factor_decrease'],
    position_brightness: ['mult_factor_increase', 'mult_factor_decrease'],
    snake_brightness: ['mult_factor_increase', 'mult_factor_decrease'],
    timed_saturation: ['mult_factor_increase', 'mult_factor_decrease'],
    position_saturation: ['mult_factor_increase', 'mult_factor_decrease'],
    snake_saturation: ['mult_factor_increase', 'mult_factor_decrease'],
};

/** Deep-clone an effect and offset the leading FloatFunction(s) by `phase`. */
function applyPhaseToEffect(effect: Effect, phase: number): Effect {
    if (phase === 0) return effect;
    const result = JSON.parse(JSON.stringify(effect));
    for (const [key, fields] of Object.entries(PHASE_FIELDS)) {
        const sub = result[key];
        if (!sub) continue;
        for (const field of fields) {
            if (sub[field]) sub[field] = offsetFloatFunction(sub[field], phase);
        }
    }
    return result;
}

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
        public startOffsetMs: number = 0,
        public beatTimestampsMs?: number[]
    ) { }

    public sync(cb: Function) {
        const emptyEffectConfig: Partial<EffectConfig> = {
            segments: "all",
        };
        als.run({ animation: this, effectConfig: emptyEffectConfig }, cb);
    }

    public addEffect(effect: Effect | Function) {
        const store = als.getStore();
        if (typeof effect === "function") {
            for (let i = 0; i < store.elements.length; i++) {
                const phase = i / store.elements.length * (store.phase ?? 0);
                const e = effect(phase);
                this.effects.push({
                    effect: e,
                    elements: [store.elements[i]],
                });
            }
            return;
        }
        const phaseIntensity = store.phase ?? 0;
        if (phaseIntensity > 0) {
            for (let i = 0; i < store.elements.length; i++) {
                const phase = i / store.elements.length * phaseIntensity;
                this.effects.push({
                    effect: applyPhaseToEffect(effect, phase),
                    elements: [store.elements[i]],
                });
            }
            return;
        }
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
