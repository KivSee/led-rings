// Generated from Timeline Manager. Place this file in your project's src/ so imports resolve.
import { sendSequence } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats, cycle, cycleBeats } from "./time/time";
import { constColor, noColor, rainbow } from "./effects/coloring";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "./effects/brightness";
import { elements, segment } from "./objects/elements";
import {
  all,
  center,
  even,
  left,
  odd,
  right,
  segment_all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_rand,
  segment_updown,
} from "./objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeHeadSin,
  snakeInOut,
  snakeSlowFast,
  snakeTailShrinkGrow,
  snakeHeadSteps,
  staticSnake,
} from "./effects/motion";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "./effects/hue";

const nocturne = async () => {
  const anim = new Animation("nocturne", 120, 60.00, 0);
  anim.sync(() => {
    beats(0, 20, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          fadeIn()
        });
      });
    })

    beats(20, 40, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
            snakeFillGrow()
          });
        });
      });
    })

    beats(40, 64, () => {
      elements(all, () => {
        segment(segment_centric, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
          snakeHeadSin({ tailLength: 0.5, cyclic: false })
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("nocturne", anim.getSequence());
  await startSong("nocturne", 0);
};

(async () => {
  await nocturne();
})();
