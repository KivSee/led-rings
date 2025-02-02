import { Effect } from "./effects/types"
import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats } from "./time/time";
import { constColor } from "./effects/coloring";
import { blink, fadeIn, fadeInOut } from "./effects/brightness";

const testSequence = async () => {

    const testAnimation = new Animation('test', 120, 5);
    testAnimation.sync(() => {
        beats(0, 12, () => {
            constColor(0.5, 1.0, 0.3);
        });
        beats(0, 12, () => {
            blink({ low: 0.5, high: 1.0 });
        });
    });

    // const brightnessIncreaseEffect: Effect = {
    //     effect_config: {
    //         start_time: 0,
    //         end_time: 900,
    //         segments: "all"
    //     },
    //     brightness: {
    //         mult_factor: {
    //             linear: {
    //                 start: 0.5,
    //                 end: 1.0
    //             },
    //         },
    //     },
    // };

    const seqPerThing: SequencePerThing = {};
    for (let i = 0; i < NUMBER_OF_RINGS; i++) {
        seqPerThing[`ring${i}`] = testAnimation.getSequence();
    }
    await sendSequence('test', seqPerThing);
    await trigger('test');
}

(async () => {
    await testSequence();
})();
