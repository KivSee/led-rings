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

const togual = async () => {
  const anim = new Animation("togual", 86, 360.00, 0);
  anim.sync(() => {
    beats(32, 44, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(44, 52, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(0.3, () => {
            constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
          });
        });
      });
    })

    beats(52, 60, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
        });
      });
    })

    beats(60, 64, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(0, 16, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          constColor({ hue: 0.4063, sat: 0.7160, val: 0.6627 })
        });
      });
    })

    beats(32, 44, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0, end: 0.7 })
        });
      });
    })

    beats(52, 60, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fade({ start: 1, end: 0 })
        });
      });
    })

    beats(60, 64, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          hueShiftStartToEnd({ start: 0, end: 1 })
        });
      });
    })

    beats(32, 44, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          snakeInOut({ start: 0, end: 1 })
        });
      });
    })

    beats(44, 52, () => {
      elements(all, () => {
        segment(segment_all, () => {
          snakeFillGrow()
        });
      });
    })

    beats(52, 60, () => {
      elements(all, () => {
        segment(segment_all, () => {
          snakeSlowFast({ tailLength: 0.6 })
        });
      });
    })

    beats(60, 64, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          snakeHeadSin({ tailLength: 0.6, cyclic: true })
        });
      });
    })

    beats(0, 16, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          snakeHeadMove({ start: 0, end: 1, tail: 0.5 })
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("togual", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("togual", 0);
  }
};

(async () => {
  await togual();
})();
