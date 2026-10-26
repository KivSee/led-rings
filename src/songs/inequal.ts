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
  snakeTurn,
  staticSnake,
} from "../effects/motion";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "../effects/hue";

const inequal = async () => {
  const anim = new Animation("inequal", 150, 312.00, 3000);
  anim.sync(() => {
    beats(0, 72, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.0036, sat: 1.0000, val: 0.7216 })
        });
      });
    })

    beats(0, 72, () => {
      elements(left, () => {
        segment(segment_b1, () => {
          phase(-1, () => {
            constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
          });
        });
      });
    })

    beats(0, 72, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
        });
      });
    })

    beats(0, 72, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          phase(0.8333, () => {
            constColor({ hue: 0.1667, sat: 0.8545, val: 0.8353 })
          });
        });
      });
    })

    beats(72, 145, () => {
      elements([1, 7], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5484, sat: 0.1216, val: 1.0000 })
        });
      });
    })

    beats(72, 145, () => {
      elements([2, 6, 8, 12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5403, sat: 0.6980, val: 1.0000 })
        });
      });
    })

    beats(72, 145, () => {
      elements([3, 5, 9, 11], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6002, sat: 0.9008, val: 0.9490 })
        });
      });
    })

    beats(72, 145, () => {
      elements([4, 10], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6998, sat: 0.8522, val: 0.9020 })
        });
      });
    })

    beats(145, 224, () => {
      elements([1, 7], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5778, sat: 0.0588, val: 1.0000 })
        });
      });
    })

    beats(145, 224, () => {
      elements([2, 6, 8, 12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5000, sat: 0.8510, val: 1.0000 })
        });
      });
    })

    beats(145, 224, () => {
      elements([3, 5, 9, 11], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6297, sat: 0.9504, val: 0.9490 })
        });
      });
    })

    beats(145, 224, () => {
      elements([4, 10], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.8395, sat: 1.0000, val: 0.9490 })
        });
      });
    })

    beats(144, 224, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5556, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(224, 275, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(0.06, () => {
            constColor({ hue: 0.5000, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(72, 144, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5556, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(275, 324, () => {
      elements([1, 5, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(275, 324, () => {
      elements([2, 6, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5098, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(275, 324, () => {
      elements([3, 7, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5203, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(275, 324, () => {
      elements([4, 8, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5307, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(282, 324, () => {
      cycle(1.5, () => {
        elements(even, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.6398, sat: 0.9490, val: 1.0000 })
          });
        });
      });
    })

    beats(354, 378, () => {
      elements([1], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6399, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(354, 378, () => {
      elements([2, 10, 11], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(354, 378, () => {
      elements([4, 7, 8], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.4902, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(354, 378, () => {
      elements([5], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(354, 378, () => {
      elements([1, 2, 10], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.4893, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(354, 378, () => {
      elements([4, 5, 7, 8], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.8590, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(354, 378, () => {
      elements([11], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5491, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(378, 420, () => {
      elements([1, 2, 10, 11, 12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(378, 420, () => {
      elements([3], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6399, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(378, 420, () => {
      elements([4, 5], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(378, 420, () => {
      elements([6, 7, 8, 9], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.4902, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(378, 420, () => {
      elements([1, 2, 3, 12], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.4893, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(378, 420, () => {
      elements([4, 5, 6, 7, 8, 9], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.8590, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(378, 420, () => {
      elements([10], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.6389, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(378, 420, () => {
      elements([11], () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5491, sat: 1.0000, val: 0.3059 })
        });
      });
    })

    beats(420, 492, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(420, 492, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.1497, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(492, 588, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          constColor({ hue: 0.4902, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(492, 588, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.9203, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(588, 756, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(756, 780, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.6399, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(0, 24, () => {
      elements([1], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 18, () => {
      elements([2], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 12, () => {
      elements([3], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 6, () => {
      elements([4], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 6, () => {
      elements([7], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 12, () => {
      elements([8], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 18, () => {
      elements([9], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 24, () => {
      elements([10], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 30, () => {
      elements([11], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 30, () => {
      elements([12], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(24, 30, () => {
      cycle(6, () => {
        elements([1], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(18, 24, () => {
      cycle(6, () => {
        elements([2], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(12, 18, () => {
      cycle(6, () => {
        elements([3], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(6, 12, () => {
      cycle(6, () => {
        elements([4], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(0, 6, () => {
      cycle(6, () => {
        elements([5], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(0, 6, () => {
      cycle(6, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(6, 12, () => {
      cycle(6, () => {
        elements([7], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(12, 18, () => {
      cycle(6, () => {
        elements([8], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(18, 24, () => {
      cycle(6, () => {
        elements([9], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(24, 30, () => {
      cycle(6, () => {
        elements([10], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(30, 36, () => {
      cycle(6, () => {
        elements([11], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(30, 36, () => {
      cycle(6, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(30, 72, () => {
      cycle(6, () => {
        elements([1], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(24, 72, () => {
      cycle(6, () => {
        elements([2], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(18, 72, () => {
      cycle(6, () => {
        elements([3], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(6, () => {
        elements([4], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(6, 72, () => {
      cycle(6, () => {
        elements([5], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(6, 72, () => {
      cycle(6, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(6, () => {
        elements([7], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(18, 72, () => {
      cycle(6, () => {
        elements([8], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(24, 72, () => {
      cycle(6, () => {
        elements([9], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(30, 72, () => {
      cycle(6, () => {
        elements([10], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(36, 72, () => {
      cycle(6, () => {
        elements([11], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(36, 72, () => {
      cycle(6, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(42, 48, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(48, 72, () => {
      elements([1], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(48, 54, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(54, 72, () => {
      elements([2], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(54, 60, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(60, 72, () => {
      elements([3], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(60, 66, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(66, 72, () => {
      elements([4], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(66, 72, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(66, 72, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(60, 66, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(66, 72, () => {
      elements([7], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(54, 60, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(60, 72, () => {
      elements([8], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(48, 54, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(54, 72, () => {
      elements([9], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(42, 48, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(48, 72, () => {
      elements([10], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 42, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(42, 72, () => {
      elements([11], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 42, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(42, 72, () => {
      elements([12], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 72, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 72, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 72, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(72, 120, () => {
      elements([1], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(120, 144, () => {
      cycle(4, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 108, () => {
      elements([2], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(108, 144, () => {
      cycle(4, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 96, () => {
      elements([3], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(96, 144, () => {
      cycle(4, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 84, () => {
      elements([4], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(84, 144, () => {
      cycle(4, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 144, () => {
      cycle(4, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 144, () => {
      cycle(4, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 84, () => {
      elements([7], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(84, 144, () => {
      cycle(4, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 96, () => {
      elements([8], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(96, 144, () => {
      cycle(4, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 108, () => {
      elements([9], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(108, 144, () => {
      cycle(4, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 120, () => {
      elements([10], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(120, 144, () => {
      cycle(4, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 132, () => {
      elements([11], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(132, 144, () => {
      cycle(4, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 132, () => {
      elements([12], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(132, 144, () => {
      cycle(4, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(72, 216, () => {
      cycle(0.33, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.7, staticPhase: 0 })
          });
        });
      });
    })

    beats(120, 144, () => {
      elements([1], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(108, 144, () => {
      elements([2], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(96, 144, () => {
      elements([3], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(84, 144, () => {
      elements([4], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(72, 144, () => {
      elements([5], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(72, 144, () => {
      elements([6], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(84, 144, () => {
      elements([7], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(96, 144, () => {
      elements([8], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(108, 144, () => {
      elements([9], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(120, 144, () => {
      elements([10], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(132, 144, () => {
      elements([11], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(132, 144, () => {
      elements([12], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(110, 140, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(140, 147, () => {
      cycle(7, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(144, 224, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(143, 147, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { half: { f1: { linear: { start: 1, end: 0.3 } }, f2: { const_value: { value: 0.3 } } } } } })
        });
      });
    })

    beats(147, 171, () => {
      elements([1], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 165, () => {
      elements([2], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 159, () => {
      elements([3], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 153, () => {
      elements([4], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 153, () => {
      elements([7], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 159, () => {
      elements([8], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 165, () => {
      elements([9], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 171, () => {
      elements([10], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 177, () => {
      elements([11], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(147, 177, () => {
      elements([12], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(171, 192, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(165, 192, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(159, 192, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(153, 192, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(147, 192, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(147, 192, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(153, 192, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(159, 192, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(165, 192, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(171, 192, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(177, 192, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(177, 192, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(147, 195, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(171, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([1], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(165, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([2], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(159, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([3], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(153, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([4], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(147, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([5], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(147, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([6], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(153, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([7], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(159, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([8], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(165, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([9], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(171, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([10], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(177, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([11], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(177, 195, () => {
      cycleBeats(6, 0, 0.5, () => {
        elements([12], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(147, 195, () => {
      elements([5, 6], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 8, diff_per_step: -0.09, first_step_value: 0.93 } } } })
        });
      });
    })

    beats(153, 195, () => {
      elements([4, 7], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 7, diff_per_step: -0.09, first_step_value: 0.84 } } } })
        });
      });
    })

    beats(159, 195, () => {
      elements([3, 8], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: -0.09, first_step_value: 0.75 } } } })
        });
      });
    })

    beats(165, 195, () => {
      elements([2, 9], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 5, diff_per_step: -0.09, first_step_value: 0.66 } } } })
        });
      });
    })

    beats(171, 195, () => {
      elements([1, 10], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 4, diff_per_step: -0.09, first_step_value: 0.57 } } } })
        });
      });
    })

    beats(177, 195, () => {
      elements([11, 12], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 3, diff_per_step: -0.09, first_step_value: 0.48 } } } })
        });
      });
    })

    beats(195, 224, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(195, 216, () => {
      cycle(3, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(216, 224, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: -0.1429, first_step_value: 0.8571 } } } })
        });
      });
    })

    beats(224, 275, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.04 } } } })
        });
      });
    })

    beats(72, 144, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    beats(270, 274, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.2 } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } })
        });
      });
    })

    beats(274, 276, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(276, 288, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    beats(275, 324, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ timed_hue: { offset_factor: { linear: { start: 0.015, end: 0 } } } })
          });
        });
      });
    })

    beats(276, 324, () => {
      elements([2, 6, 10], () => {
        segment(segment_all, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.03 } }, f2: { const_value: { value: 0.03 } } } }, f2: { const_value: { value: 0.03 } } } } } })
        });
      });
    })

    beats(276, 324, () => {
      elements([3, 7, 11], () => {
        segment(segment_all, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.06 } }, f2: { const_value: { value: 0.06 } } } }, f2: { const_value: { value: 0.06 } } } } } })
        });
      });
    })

    beats(276, 324, () => {
      elements([4, 8, 12], () => {
        segment(segment_all, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.089 } }, f2: { const_value: { value: 0.089 } } } }, f2: { const_value: { value: 0.089 } } } } } })
        });
      });
    })

    beats(275, 324, () => {
      cycle(0.5, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_hue: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.3 } }, cyclic: true, offset_factor: { const_value: { value: 0.02 } } } })
          });
        });
      });
    })

    beats(315, 324, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.2 } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } })
        });
      });
    })

    beats(282, 324, () => {
      cycle(1.5, () => {
        elements(even, () => {
          segment(segment_b1, () => {
            addEffect({ timed_brightness: { mult_factor_decrease: { half: { f1: { linear: { start: 1, end: 0.7 } }, f2: { linear: { start: 0.7, end: 0.35 } } } } } })
          });
        });
      });
    })

    beats(354, 378, () => {
      cycle(1.5, () => {
        elements([1, 2, 4, 5, 7, 8, 10, 11], () => {
          segment(segment_all, () => {
            phase(1, () => {
              pulse({ low: 0.4707 })
            });
          });
        });
      });
    })

    beats(378, 420, () => {
      cycle(1.5, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(1, () => {
              pulse({ low: 0.4707 })
            });
          });
        });
      });
    })

    beats(420, 492, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          addEffect({ position_hue: { offset_factor: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.63 } } } } } })
        });
      });
    })

    beats(420, 492, () => {
      cycle(4.5, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.15 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(420, 492, () => {
      cycle(6, () => {
        elements(odd, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(423, 492, () => {
      cycle(6, () => {
        elements(even, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(492, 588, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          addEffect({ position_hue: { offset_factor: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.15 } } } } } })
        });
      });
    })

    beats(492, 588, () => {
      cycle(4.5, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 1, end: 0 } }, tail_length: { const_value: { value: 0.15 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(492, 588, () => {
      cycle(6, () => {
        elements(odd, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(495, 588, () => {
      cycle(6, () => {
        elements(even, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(468, 492, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 4, diff_per_step: 0.0778, first_step_value: 0.3 } } } })
        });
      });
    })

    beats(492, 528, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: 0.0778, first_step_value: 0.6111 } } } })
        });
      });
    })

    beats(528, 588, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 10, diff_per_step: -0.0778, first_step_value: 1 } } } })
        });
      });
    })

    beats(588, 756, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_hue: { offset_factor: { half: { f1: { half: { f1: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.63 } } } }, f2: { half: { f1: { const_value: { value: 0.63 } }, f2: { const_value: { value: 0 } } } } } }, f2: { half: { f1: { const_value: { value: 0.63 } }, f2: { const_value: { value: 0 } } } } } } } })
          });
        });
      });
    })

    beats(756, 780, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_hue: { offset_factor: { half: { f1: { half: { f1: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.85 } } } }, f2: { half: { f1: { const_value: { value: 0.85 } }, f2: { const_value: { value: 0 } } } } } }, f2: { half: { f1: { const_value: { value: 0.85 } }, f2: { const_value: { value: 0 } } } } } } } })
          });
        });
      });
    })

    beats(588, 756, () => {
      elements(all, () => {
        segment(segment_all, () => {
          hueShiftStartToEnd({ start: 0, end: -0.8 })
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 28, diff_per_step: 0.0278, first_step_value: 0.25 } } } })
        });
      });
    })

    beats(762, 780, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(18, 72, () => {
      cycle(12, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(6, 72, () => {
      cycle(12, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 72, () => {
      cycle(12, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 72, () => {
      cycle(12, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(6, 72, () => {
      cycle(12, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(18, 72, () => {
      cycle(12, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(30, 72, () => {
      cycle(12, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(30, 72, () => {
      cycle(12, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(120, 144, () => {
      cycle(4, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(108, 144, () => {
      cycle(4, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(96, 144, () => {
      cycle(4, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(84, 144, () => {
      cycle(4, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(72, 144, () => {
      cycle(4, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(72, 144, () => {
      cycle(4, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(84, 144, () => {
      cycle(4, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(96, 144, () => {
      cycle(4, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(108, 144, () => {
      cycle(4, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(120, 144, () => {
      cycle(4, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(132, 144, () => {
      cycle(4, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(132, 144, () => {
      cycle(4, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(144, 224, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(224, 228, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            staticSnake({ start: 1, end: 0.65 })
          });
        });
      });
    })

    beats(228, 248, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(1, () => {
              snake({ tailLength: 0.35, cyclic: true, reverse: false })
            });
          });
        });
      });
    })

    beats(248, 252, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            snakeTurn({ tailLength: 0.35, speed: 1, cyclic: true })
          });
        });
      });
    })

    beats(252, 275, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(1, () => {
              snake({ tailLength: 0.35, cyclic: true, reverse: true })
            });
          });
        });
      });
    })

    beats(275, 324, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(0.5, () => {
              snake({ tailLength: 0.5, cyclic: true, reverse: false })
            });
          });
        });
      });
    })

    beats(354, 378, () => {
      cycle(1.5, () => {
        elements([1, 2, 4, 5, 7, 8, 10, 11], () => {
          segment(segment_arc, () => {
            phase(7, () => {
              snakeHeadSteps({ steps: 4, tailLength: 0.5 })
            });
          });
        });
      });
    })

    beats(354, 378, () => {
      cycle(6, () => {
        elements([1, 2, 4, 5, 7, 8, 10, 11], () => {
          segment(segment_updown, () => {
            phase(0.3333, () => {
              snakeHeadSin({ tailLength: 2, cyclic: false })
            });
          });
        });
      });
    })

    beats(378, 420, () => {
      cycle(1.5, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            phase(11, () => {
              snakeHeadSteps({ steps: 4, tailLength: 0.5 })
            });
          });
        });
      });
    })

    beats(378, 420, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_updown, () => {
            phase(0.5, () => {
              snakeHeadSin({ tailLength: 2, cyclic: false })
            });
          });
        });
      });
    })

    beats(420, 492, () => {
      cycle(18, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            snakeHeadSteps({ steps: 12, tailLength: 0.25 })
          });
        });
      });
    })

    beats(420, 492, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            phase(1, () => {
              snake({ tailLength: 0.15, cyclic: true, reverse: false })
            });
          });
        });
      });
    })

    beats(492, 588, () => {
      cycle(18, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            snakeHeadSteps({ steps: 12, tailLength: 0.25 })
          });
        });
      });
    })

    beats(492, 588, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            phase(1, () => {
              snake({ tailLength: 0.15, cyclic: true, reverse: true })
            });
          });
        });
      });
    })

    beats(588, 756, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            phase(0.5, () => {
              snakeInOut()
            });
          });
        });
      });
    })

    beats(756, 780, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            phase(0.5, () => {
              snakeInOut()
            });
          });
        });
      });
    })

    beats(224, 228, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          addEffect({ timed_brightness: { mult_factor_increase: { const_value: { value: 1 } } } })
        });
      });
    })

    beats(224, 228, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { sin: { min: 0, max: 2, phase: 0.75, repeats: 0.25 } } } })
        });
      });
    })

    beats(228, 275, () => {
      cycle(1.5, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(228, 275, () => {
      cycleBeats(1.5, 0, 0.75, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(228, 275, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(224, 275, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.7 } } } })
        });
      });
    })

    beats(275, 324, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(275, 324, () => {
      cycleBeats(2, 0, 1, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_brightness: { mult_factor_decrease: { half: { f1: { const_value: { value: 1 } }, f2: { const_value: { value: 0.5 } } } } } })
          });
        });
      });
    })

    beats(275, 324, () => {
      cycleBeats(2, 1, 2, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_brightness: { mult_factor_decrease: { half: { f1: { const_value: { value: 0.5 } }, f2: { const_value: { value: 1 } } } } } })
          });
        });
      });
    })

    beats(275, 324, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.35 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(275, 324, () => {
      cycle(12, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(275, 324, () => {
      cycle(9, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })
  });

  anim.mirrorToLilum([1, 4, 5, 7, 10]);
  console.log("sending sequence");
  await sendSequence("inequal", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("inequal", 0);
  }
};

(async () => {
  await inequal();
})();
