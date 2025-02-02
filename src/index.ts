import { Effect } from "./effects/types"
import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycleBeats } from "./time/time";
import { constColor } from "./effects/coloring";
import { blink, fadeIn, fadeInOut, fadeOutIn } from "./effects/brightness";

const testSequence = async () => {

    const testAnimation = new Animation('test', 120, 50);
    testAnimation.sync(() => {
        beats(0, 120, () => {
            constColor(0.5, 1.0, 0.3);
            cycleBeats(4, 0, 2, () => {
                fadeOutIn({ min: 0.5 });
            });
            cycleBeats(4, 2, 4, () => {
                constColor(0.3, 0.8, 0.3);
            });
        });
    });

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
