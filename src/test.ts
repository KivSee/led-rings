// Generated from Timeline Manager. Place this file in your project's src/ so imports resolve.
import { sendSequence } from "./services/sequence";
import { startSong } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats } from "./time/time";
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

const testSequence = async () => {
  const testAnimation = new Animation("test", 120, 32.00, 0);
  testAnimation.sync(() => {
    beats(0, 8, () => {
      elements(all, () => {
        segment(segment_all, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
            snakeFillGrow()
        });
      });
    })

    beats(8, 28, () => {
      elements(all, () => {
        segment(segment_all, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(28, 32, () => {
      elements(all, () => {
        segment(segment_all, () => {
            constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("test", testAnimation.getSequence());
  await startSong("test", 0);
};

(async () => {
  await testSequence();
})();
