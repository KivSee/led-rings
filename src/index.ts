import { Effect } from "./effects/types";
import { sendSequence, SequencePerThing } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycleBeats } from "./time/time";
import { constColor } from "./effects/coloring";
import { blink, fadeIn, fadeInOut, fadeOutIn } from "./effects/brightness";
import { elements, segment } from "./objects/elements";
import {
  all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
} from "./objects/ring-elements";
import { snake, snakeInOut } from "./effects/motion";
import { phase } from "./phase/phase";

const testSequence = async () => {
  const testAnimation = new Animation("req", 126, 50);
  testAnimation.sync(() => {
    beats(0, 120, () => {
      phase(3, () => {
        elements(all, () => {
          constColor(0.0, 1.0, 0.5);
          segment(segment_b1, () => {
            cycleBeats(4, 0, 4, () => {
              fadeOutIn({ min: 0.5 });
            });
          });
          segment(segment_b2, () => {
            cycleBeats(8, 0, 8, () => {
              constColor(0.3, 1.0, 0.3);
              fadeInOut({ min: 0.5, max: 0.9 });
            });
          });
          segment(segment_arc, () => {
            cycleBeats(2, 0, 2.0, () => {
              phase(1, () => {
                snakeInOut();
              });
            });
          });
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
