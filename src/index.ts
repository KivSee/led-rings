import { Effect } from "./effects/types"
import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";

const testSequence = async () => {
    const constColorEffect: Effect = {
        effect_config: {
            start_time: 0,
            end_time: 900,
            segments: "all"
        },
        const_color: {
            color: {
                hue: 1.0,
                sat: 1.0,
                val: 0.3
            }
        }
    };

    const brightnessIncreaseEffect: Effect = {
        effect_config: {
            start_time: 0,
            end_time: 900,
            segments: "all"
        },
        brightness: {
            mult_factor: {
                linear: {
                    start: 0.5,
                    end: 1.0
                },
            },
        },
    };

    const sequence = {
        effects: [constColorEffect, brightnessIncreaseEffect],
        duration_ms: 1000,
        num_repeats: 0
    };

    const seqPerThing: SequencePerThing = {};
    for (let i = 0; i < NUMBER_OF_RINGS; i++) {
        seqPerThing[`ring${i}`] = sequence;
    }
    await sendSequence('test', seqPerThing);
    await trigger('test');
}

(async () => {
    await testSequence();
})();
