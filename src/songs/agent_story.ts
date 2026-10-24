// Generated from Timeline Manager.
import { sendSequence } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats } from "../time/time";
import { phase } from "../phase/phase";
import { constColor, noColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "../effects/brightness";
import { elements, segment } from "../objects/elements";
import {
  all,
  b1,
  b2,
  bottom,
  even,
  left,
  odd,
  right,
  top,
  segment_all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_rad,
  segment_rand,
  segment_updown,
} from "../objects/ring-elements";
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
} from "../effects/motion";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "../effects/hue";

const agentStory = async () => {
  const anim = new Animation("agent_story", 120, 18.00, 0);
  anim.sync(() => {
    beats(0, 36, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(0, 36, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(0, 2, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(34, 36, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(0, 36, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            snake({ tailLength: 0.6, cyclic: true })
          });
        });
      });
    })
  });

  anim.mirrorToLilum([1, 4, 5, 7, 10]);
  console.log("sending sequence");
  await sendSequence("agent_story", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("agent_story", 0);
  }
};

(async () => {
  await agentStory();
})();
