import { Effect } from "./effects/types";
import { sendSequence, SequencePerThing } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycleBeats } from "./time/time";
import { constColor, rainbow } from "./effects/coloring";
import {
  blink,
  brightness,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
} from "./effects/brightness";
import { elements, segment } from "./objects/elements";
import {
  all,
  center,
  left,
  right,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_updown,
} from "./objects/ring-elements";
import { snake, snakeFillGrow, snakeInOut } from "./effects/motion";
import { phase } from "./phase/phase";

const testSequence = async () => {
  const testAnimation = new Animation("aladdin", 64.725, 79, 575);
  testAnimation.sync(() => {
    beats(0, 16, () => {
      elements(all, () => {
        rainbow({ startHue: 0.05, endHue: 0.15 });
        brightness({ value: 0.3 });
        segment(segment_updown, () => {
          cycleBeats(2, 0, 2, () => {
            phase(0, () => {
              snakeInOut();
            });
          });
        });
        cycleBeats(1, 0, 1, () => {
          fadeOut({ start: 1.0, end: 0.75 });
        });
      });
    });

    beats(8, 16, () => {
      elements(center, () => {
        segment(segment_arc, () => {
          rainbow({ startHue: 0.75, endHue: 0.98 });
          brightness({ value: 0.3 });
          cycleBeats(8, 0, 8, () => {
            snakeInOut();
          });
        });
      });

      beats(7, 9, () => {
        elements(center, () => {
          fadeOutIn({ min: 0.0 });
        });
      });

      beats(15, 16, () => {
        elements(all, () => {
          fadeOut();
        });
      });

      beats(16, 24, () => {
        elements(left, () => {
          constColor(0.68, 0.9, 0.2);
        });
      });

      for (let i = 0; i < 6; i++) {
        elements([i + 1], () => {
          beats(16, 16 + i, () => {
            constColor(0, 0, 0);
          });
          segment(segment_arc, () => {
            beats(16 + i, 16 + i + 2, () => {
              snakeFillGrow();
            });
          });
        });
      }

      beats(24, 32, () => {
        elements(right, () => {
          constColor(0.68, 0.9, 0.2);
        });
      });

      for (let i = 0; i < 6; i++) {
        elements([12 - i], () => {
          beats(24, 24 + i, () => {
            constColor(0, 0, 0);
          });
          segment(segment_arc, () => {
            beats(24 + i, 24 + i + 2, () => {
              snakeFillGrow();
            });
          });
        });
      }

      for (let i = 0; i < 12; i++) {
        const rel = i / 12;
        beats(31.5 + rel * 1.5, 31.5 + rel * 1.5 + 0.5, () => {
          elements([i + 1], () => {
            constColor(0.68, 0.9, 0.2);
            fadeInOut({ min: 0.0, max: 1.0 });
          });
        });
      }

      for (let i = 0; i < 12; i++) {
        const rel = i / 12;
        beats(33.5 + rel * 1.5, 33.5 + rel * 1.5 + 0.5, () => {
          elements([12 - i], () => {
            constColor(0.05, 0.95, 0.3);
            fadeOut();
          });
        });
      }
    });
  });

  await sendSequence("aladdin", testAnimation.getSequence());
  await startSong("aladdin", 0);
};

(async () => {
  await testSequence();
})();
