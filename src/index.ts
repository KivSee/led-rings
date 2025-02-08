import { Effect } from "./effects/types";
import { sendSequence, SequencePerThing } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycleBeats } from "./time/time";
import { constColor } from "./effects/coloring";
import { blink, fadeIn, fadeInOut, fadeOutIn } from "./effects/brightness";
import { elements } from "./objects/elements";
import { all } from "./objects/ring-elements";
import { snake, snakeInOut } from "./effects/motion";

const testSequence = async () => {
  const testAnimation = new Animation("req", 126, 50);
  testAnimation.sync(() => {
    beats(0, 120, () => {
      elements(all, () => {
        constColor(0.0, 1.0, 0.3);
        cycleBeats(4, 0, 2, () => {
          fadeOutIn({ min: 0.5 });
        });
        cycleBeats(1, 0, 1, () => {
          snake();
        });
      });
    });
  });

  await sendSequence("req", testAnimation.getSequence());
  await startSong("req");
};

(async () => {
  await testSequence();
})();
