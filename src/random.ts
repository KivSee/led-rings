import { sendSequence } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats, cycleBeats } from "./time/time";
import { elements, segment } from "./objects/elements";
import {
  all,
  even,
  odd,
  segment_arc,
  segment_b1,
  segment_b2,
} from "./objects/ring-elements";
import {
  constColor,
  fullRainbow,
  noColor,
  pastel,
  randomRangeColor,
  vivid,
} from "./effects/coloring";
import { phase } from "./phase/phase";
import { fadeIn, fadeOut } from "./effects/brightness";
import { snake, snakeInOut } from "./effects/motion";
import { addRandomColoring } from "./random/coloring";
import { addRandomBrightness } from "./random/brightness";
import { addRandomMotion } from "./random/motion";

const animationName = "random";
const SECONDS_PER_PATTERN = 5;
const NUM_PATTERNS = 40;
const TOTAL_SECONDS = SECONDS_PER_PATTERN * NUM_PATTERNS;
const BPM = 60;
const TOTAL_BEATS = (TOTAL_SECONDS * BPM) / 60;

const pattern = (i: number, cb: Function) => {
  beats(i * SECONDS_PER_PATTERN, (i + 1) * SECONDS_PER_PATTERN, cb);
};

const random = async () => {
  const r = new Animation(animationName, BPM, TOTAL_SECONDS);

  r.sync(() => {
    for (let i = 0; i < NUM_PATTERNS; i++) {
      pattern(i, () => {
        addRandomColoring();
        addRandomBrightness();
        addRandomMotion();
        addRandomMotion();
      });
    }
    beats(0, TOTAL_BEATS, () => {
      elements(all, () => {
        cycleBeats(SECONDS_PER_PATTERN, 0, 0.5, () => {
          fadeIn();
        });
        cycleBeats(SECONDS_PER_PATTERN, SECONDS_PER_PATTERN - 0.5, SECONDS_PER_PATTERN, () => {
          fadeOut();
        });
      });
    });
  });

  const seq = r.getSequence();
  console.log(JSON.stringify(seq, null, 2).length);
  await sendSequence(animationName, seq);
  await trigger(animationName);
};

(async () => {
  await random();
})();
