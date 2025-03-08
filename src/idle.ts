import { sendSequence } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats } from "./time/time";
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
} from "./effects/coloring";
import { phase } from "./phase/phase";
import { fadeIn, fadeOut } from "./effects/brightness";
import { snake, snakeInOut } from "./effects/motion";

const animationName = "idle";
const SECONDS_PER_PATTERN = 12;
const NUM_PATTERNS = 2;
const TOTAL_SECONDS = SECONDS_PER_PATTERN * NUM_PATTERNS;
const BPM = 60;

const pattern = (i: number, cb: Function) => {
  beats(i * SECONDS_PER_PATTERN, (i + 1) * SECONDS_PER_PATTERN, cb);
};

const idle = async () => {
  const r = new Animation(animationName, BPM, TOTAL_SECONDS);

  r.sync(() => {
    beats(0, 12, () => {
      elements(even, () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0, sat: 0.0, val: 0.5 });
          fadeIn();
        });
      });
    });
    beats(0, 4, () => {
      elements(even, () => {
        fadeIn();
      });
    });
    beats(4, 12, () => {
      elements(odd, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.0, sat: 0.0, val: 0.5 });
        });
      });
    });
    beats(4, 12, () => {
      elements(odd, () => {
        fadeIn();
      });
    });
    beats(8, 12, () => {
      elements(even, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.0, sat: 0.0, val: 0.5 });
        });
      });
      elements(odd, () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0, sat: 0.0, val: 0.5 });
        });
      });
    });
    beats(8, 10, () => {
      elements(even, () => {
        segment(segment_b2, () => {
          fadeIn();
        });
      });
      elements(odd, () => {
        segment(segment_b1, () => {
          fadeIn();
        });
      });
    });
    beats(10, 12, () => {
      elements(all, () => {
        fadeOut();
      });
    });

    beats(12, 24, () => {
      for (let i = 0; i < 12; i++) {
        elements([i + 1], () => {
          phase(1.0, () => {
            beats(12 + i, 12 + i + 3, () => {
              pastel({ hue: i / 12 });
            });
          });
          segment(segment_arc, () => {
            beats(12 + i, 12 + i + 3, () => {
              snakeInOut();
            });
          });
        });
      }
    });
  });

  const seq = r.getSequence();
  console.log(JSON.stringify(seq, null, 2));
  await sendSequence(animationName, seq);
  await trigger(animationName);
};

(async () => {
  await idle();
})();
