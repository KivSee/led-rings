import { Animation } from "./animation/animation";
import {
  blink,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "./effects/brightness";
import { constColor, dotted } from "./effects/coloring";
import {
  snake,
  snakeInOut,
  snakeTailShrinkGrow,
  staticSnake,
} from "./effects/motion";
import { elements, segment } from "./objects/elements";
import {
  all,
  even,
  odd,
  segment_all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_updown,
} from "./objects/ring-elements";
import { phase } from "./phase/phase";
import { sendSequence } from "./services/sequence";
import { trigger } from "./services/trigger";
import { beats, cycle, cycleBeats } from "./time/time";

const playground = async () => {
  const pg = new Animation("playground", 60, 30);

  pg.sync(() => {
    beats(0, 30, () => {
      elements(all, () => {
        phase(6.0, () => {
          dotted({ hueDiff: 0.7, contrast: 0.5 });
        });
      });
    });
  });

  await sendSequence("playground", pg.getSequence());
  await trigger("playground");
};

(async () => {
  await playground();
})();
