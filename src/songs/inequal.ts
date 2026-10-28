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
import { labSection, sectionLayer } from "../lab/labSection";

const inequal = async () => {
  const anim = new Animation("inequal", 100, 312.00, 0);
  anim.sync(() => {
    beats(0, 48, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.0036, sat: 1.0000, val: 0.7216 })
        });
      });
    })

    beats(0, 48, () => {
      elements(left, () => {
        segment(segment_b1, () => {
          phase(-1, () => {
            constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
          });
        });
      });
    })

    beats(0, 48, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
        });
      });
    })

    beats(0, 48, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          phase(0.8333, () => {
            constColor({ hue: 0.1667, sat: 0.8545, val: 0.8353 })
          });
        });
      });
    })

    beats(48, 96.666667, () => {
      elements([1, 7], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5484, sat: 0.1216, val: 1.0000 })
        });
      });
    })

    beats(48, 96.666667, () => {
      elements([2, 6, 8, 12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5403, sat: 0.6980, val: 1.0000 })
        });
      });
    })

    beats(48, 96.666667, () => {
      elements([3, 5, 9, 11], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6002, sat: 0.9008, val: 0.9490 })
        });
      });
    })

    beats(48, 96.666667, () => {
      elements([4, 10], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6998, sat: 0.8522, val: 0.9020 })
        });
      });
    })

    beats(96.666667, 149.333333, () => {
      elements([1, 7], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5778, sat: 0.0588, val: 1.0000 })
        });
      });
    })

    beats(96.666667, 149.333333, () => {
      elements([2, 6, 8, 12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.5000, sat: 0.8510, val: 1.0000 })
        });
      });
    })

    beats(96.666667, 149.333333, () => {
      elements([3, 5, 9, 11], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.6297, sat: 0.9504, val: 0.9490 })
        });
      });
    })

    beats(96.666667, 149.333333, () => {
      elements([4, 10], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.8395, sat: 1.0000, val: 0.9490 })
        });
      });
    })

    beats(96, 149.333333, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5556, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(149.333333, 168, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(0.06, () => {
            constColor({ hue: 0.5000, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(168, 181.333333, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(0.06, () => {
            constColor({ hue: 0.5000, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(48, 96, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.5556, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    sectionLayer(anim, 181.333333, 216, {"kind":"rotation","order":[12,1,2,3,4,5,6,7,8,9,10,11],"colors":[{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235}],"hues":[0.743,0.493,0.997,0.743,0.997,0.493,0.743,0.493,0.997,0.493,0.743,0.997],"firstSwap":183,"every":2,"segment":{"mapping":"arc","tail":0.25,"shift":{"0.743":0.25,"0.493":0.25,"0.997":-0.504}}}, 'color');

    beats(188, 216, () => {
      cycle(1, () => {
        elements(even, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.6398, sat: 0.9490, val: 1.0000 })
          });
        });
      });
    })

    beats(280, 328, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(280, 328, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.1497, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(328, 392, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          constColor({ hue: 0.4902, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(328, 392, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.9203, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(392, 504, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.8601, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(504, 520, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.6399, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(0, 16, () => {
      elements([1], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 12, () => {
      elements([2], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 8, () => {
      elements([3], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 4, () => {
      elements([4], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 4, () => {
      elements([7], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 8, () => {
      elements([8], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 12, () => {
      elements([9], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 16, () => {
      elements([10], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 20, () => {
      elements([11], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 20, () => {
      elements([12], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(16, 20, () => {
      cycle(4, () => {
        elements([1], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(12, 16, () => {
      cycle(4, () => {
        elements([2], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(8, 12, () => {
      cycle(4, () => {
        elements([3], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(4, 8, () => {
      cycle(4, () => {
        elements([4], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(0, 4, () => {
      cycle(4, () => {
        elements([5], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(0, 4, () => {
      cycle(4, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(4, 8, () => {
      cycle(4, () => {
        elements([7], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(8, 12, () => {
      cycle(4, () => {
        elements([8], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(12, 16, () => {
      cycle(4, () => {
        elements([9], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(16, 20, () => {
      cycle(4, () => {
        elements([10], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(20, 24, () => {
      cycle(4, () => {
        elements([11], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(20, 24, () => {
      cycle(4, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, outLow: 0.4 })
          });
        });
      });
    })

    beats(20, 48, () => {
      cycle(4, () => {
        elements([1], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(16, 48, () => {
      cycle(4, () => {
        elements([2], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(12, 48, () => {
      cycle(4, () => {
        elements([3], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(8, 48, () => {
      cycle(4, () => {
        elements([4], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(4, 48, () => {
      cycle(4, () => {
        elements([5], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(4, 48, () => {
      cycle(4, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(8, 48, () => {
      cycle(4, () => {
        elements([7], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(12, 48, () => {
      cycle(4, () => {
        elements([8], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(16, 48, () => {
      cycle(4, () => {
        elements([9], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(20, 48, () => {
      cycle(4, () => {
        elements([10], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(24, 48, () => {
      cycle(4, () => {
        elements([11], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(24, 48, () => {
      cycle(4, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeInOut({ high: 1, low: 0.4 })
          });
        });
      });
    })

    beats(28, 32, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(32, 48, () => {
      elements([1], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(32, 36, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(36, 48, () => {
      elements([2], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 40, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(40, 48, () => {
      elements([3], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(40, 44, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(44, 48, () => {
      elements([4], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(44, 48, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(44, 48, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(40, 44, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(44, 48, () => {
      elements([7], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 40, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(40, 48, () => {
      elements([8], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(32, 36, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(36, 48, () => {
      elements([9], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(28, 32, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(32, 48, () => {
      elements([10], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(24, 28, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(28, 48, () => {
      elements([11], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(24, 28, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(28, 48, () => {
      elements([12], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 48, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 48, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(0, 48, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(21.333333, 32, () => {
      elements([11], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: -0.4 } }, f2: { const_value: { value: -0.4 } } } }, f2: { const_value: { value: -0.4 } } } } } })
          addEffect({ timed_saturation: { mult_factor_increase: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.3127 } }, f2: { const_value: { value: 0.3127 } } } }, f2: { const_value: { value: 0.3127 } } } } } })
        });
      });
    })

    beats(21.333333, 32, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: -0.46 } }, f2: { const_value: { value: -0.46 } } } }, f2: { const_value: { value: -0.46 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { half: { f1: { linear: { start: 1, end: 0.8192 } }, f2: { const_value: { value: 0.8192 } } } }, f2: { const_value: { value: 0.8192 } } } } } })
        });
      });
    })

    beats(25.333333, 36, () => {
      elements([1], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.381 } }, f2: { const_value: { value: 0.381 } } } }, f2: { const_value: { value: 0.381 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { half: { f1: { linear: { start: 1, end: 0.1404 } }, f2: { const_value: { value: 0.1404 } } } }, f2: { const_value: { value: 0.1404 } } } } } })
        });
      });
    })

    beats(25.333333, 36, () => {
      elements([10], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: -0.467 } }, f2: { const_value: { value: -0.467 } } } }, f2: { const_value: { value: -0.467 } } } } } })
        });
      });
    })

    beats(29.333333, 40, () => {
      elements([2], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.207 } }, f2: { const_value: { value: 0.207 } } } }, f2: { const_value: { value: 0.207 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { half: { f1: { linear: { start: 1, end: 0.8192 } }, f2: { const_value: { value: 0.8192 } } } }, f2: { const_value: { value: 0.8192 } } } } } })
        });
      });
    })

    beats(29.333333, 40, () => {
      elements([9], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.267 } }, f2: { const_value: { value: 0.267 } } } }, f2: { const_value: { value: 0.267 } } } } } })
          addEffect({ timed_saturation: { mult_factor_increase: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.3127 } }, f2: { const_value: { value: 0.3127 } } } }, f2: { const_value: { value: 0.3127 } } } } } })
        });
      });
    })

    beats(33.333333, 44, () => {
      elements([3], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.1 } }, f2: { const_value: { value: 0.1 } } } }, f2: { const_value: { value: 0.1 } } } } } })
          addEffect({ timed_saturation: { mult_factor_increase: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.3127 } }, f2: { const_value: { value: 0.3127 } } } }, f2: { const_value: { value: 0.3127 } } } } } })
        });
      });
    })

    beats(33.333333, 44, () => {
      elements([8], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.04 } }, f2: { const_value: { value: 0.04 } } } }, f2: { const_value: { value: 0.04 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { half: { f1: { linear: { start: 1, end: 0.8192 } }, f2: { const_value: { value: 0.8192 } } } }, f2: { const_value: { value: 0.8192 } } } } } })
        });
      });
    })

    beats(37.333333, 48, () => {
      elements([4], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: 0.033 } }, f2: { const_value: { value: 0.033 } } } }, f2: { const_value: { value: 0.033 } } } } } })
        });
      });
    })

    beats(37.333333, 48, () => {
      elements([7], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { half: { f1: { linear: { start: 0, end: -0.119 } }, f2: { const_value: { value: -0.119 } } } }, f2: { const_value: { value: -0.119 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { half: { f1: { linear: { start: 1, end: 0.1404 } }, f2: { const_value: { value: 0.1404 } } } }, f2: { const_value: { value: 0.1404 } } } } } })
        });
      });
    })

    beats(41.333333, 48, () => {
      elements([5], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { linear: { start: 0, end: -0.233 } }, f2: { const_value: { value: -0.233 } } } } } })
          addEffect({ timed_saturation: { mult_factor_increase: { half: { f1: { linear: { start: 0, end: 0.3127 } }, f2: { const_value: { value: 0.3127 } } } } } })
        });
      });
    })

    beats(41.333333, 48, () => {
      elements([6], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { half: { f1: { linear: { start: 0, end: -0.293 } }, f2: { const_value: { value: -0.293 } } } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { half: { f1: { linear: { start: 1, end: 0.8192 } }, f2: { const_value: { value: 0.8192 } } } } } })
        });
      });
    })

    beats(48, 80, () => {
      elements([1], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(80, 96, () => {
      cycle(2.666667, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 72, () => {
      elements([2], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(72, 96, () => {
      cycle(2.666667, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 64, () => {
      elements([3], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(64, 96, () => {
      cycle(2.666667, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 56, () => {
      elements([4], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(56, 96, () => {
      cycle(2.666667, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 96, () => {
      cycle(2.666667, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 96, () => {
      cycle(2.666667, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 56, () => {
      elements([7], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(56, 96, () => {
      cycle(2.666667, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 64, () => {
      elements([8], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(64, 96, () => {
      cycle(2.666667, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 72, () => {
      elements([9], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(72, 96, () => {
      cycle(2.666667, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 80, () => {
      elements([10], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(80, 96, () => {
      cycle(2.666667, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 88, () => {
      elements([11], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(88, 96, () => {
      cycle(2.666667, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 88, () => {
      elements([12], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(88, 96, () => {
      cycle(2.666667, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(48, 144, () => {
      cycle(0.22, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.7, staticPhase: 0 })
          });
        });
      });
    })

    beats(80, 96, () => {
      elements([1], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(72, 96, () => {
      elements([2], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(64, 96, () => {
      elements([3], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(56, 96, () => {
      elements([4], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(48, 96, () => {
      elements([5], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(48, 96, () => {
      elements([6], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(56, 96, () => {
      elements([7], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(64, 96, () => {
      elements([8], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(72, 96, () => {
      elements([9], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(80, 96, () => {
      elements([10], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(88, 96, () => {
      elements([11], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(88, 96, () => {
      elements([12], () => {
        segment(segment_centric, () => {
          fade({ start: 0.4, end: 1 })
        });
      });
    })

    beats(73.333333, 93.333333, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(93.333333, 98, () => {
      cycle(4.666667, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.5, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(96, 149.333333, () => {
      cycle(2.666667, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(95.333333, 98, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { half: { f1: { linear: { start: 1, end: 0.6 } }, f2: { const_value: { value: 0.6 } } } } } })
        });
      });
    })

    beats(98, 114, () => {
      elements([1], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 110, () => {
      elements([2], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 106, () => {
      elements([3], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 102, () => {
      elements([4], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 102, () => {
      elements([7], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 106, () => {
      elements([8], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 110, () => {
      elements([9], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 114, () => {
      elements([10], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 118, () => {
      elements([11], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(98, 118, () => {
      elements([12], () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.6 } } } })
        });
      });
    })

    beats(114, 128, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(110, 128, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(106, 128, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(102, 128, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(98, 128, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(98, 128, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(102, 128, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(106, 128, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(110, 128, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(114, 128, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(118, 128, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(118, 128, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fade({ start: 0.6, end: 1 })
        });
      });
    })

    beats(98, 130, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.5, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(114, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([1], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(110, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([2], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(106, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([3], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(102, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([4], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(98, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([5], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(98, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([6], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(102, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([7], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(106, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([8], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(110, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([9], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(114, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([10], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(118, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([11], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(118, 130, () => {
      cycleBeats(4, 0, 0.333333, () => {
        elements([12], () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.35, end: 0 } } } })
          });
        });
      });
    })

    beats(98, 130, () => {
      elements([5, 6], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 8, diff_per_step: -0.09, first_step_value: 0.93 } } } })
        });
      });
    })

    beats(102, 130, () => {
      elements([4, 7], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 7, diff_per_step: -0.09, first_step_value: 0.84 } } } })
        });
      });
    })

    beats(106, 130, () => {
      elements([3, 8], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: -0.09, first_step_value: 0.75 } } } })
        });
      });
    })

    beats(110, 130, () => {
      elements([2, 9], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 5, diff_per_step: -0.09, first_step_value: 0.66 } } } })
        });
      });
    })

    beats(114, 130, () => {
      elements([1, 10], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 4, diff_per_step: -0.09, first_step_value: 0.57 } } } })
        });
      });
    })

    beats(118, 130, () => {
      elements([11, 12], () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 3, diff_per_step: -0.09, first_step_value: 0.48 } } } })
        });
      });
    })

    beats(130, 149.333333, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0.3 } } } })
        });
      });
    })

    beats(130, 144, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.5, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(144, 149.333333, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: -0.1429, first_step_value: 0.8571 } } } })
        });
      });
    })

    beats(149.333333, 168, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.04 } } } })
        });
      });
    })

    beats(168, 181.333333, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.04 } } } })
        });
      });
    })

    beats(168, 181.333333, () => {
      elements(all, () => {
        segment(segment_rad, () => {
          addEffect({ position_hue: { offset_factor: { fixed_window: { start: 0.5, end: 1, outside_value: 0, func: { const_value: { value: 0.22 } } } } } })
          addEffect({ position_saturation: { mult_factor_decrease: { fixed_window: { start: 0.5, end: 1, outside_value: 1, func: { linear: { start: 0.55, end: 1 } } } } } })
        });
      });
    })

    beats(48, 96, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    beats(180, 182.666667, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.2 } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } })
        });
      });
    })

    beats(182.666667, 184, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(184, 192, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    sectionLayer(anim, 181.333333, 216, {"kind":"rotation","order":[12,1,2,3,4,5,6,7,8,9,10,11],"colors":[{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235},{"hue":0.4927,"sat":0.717,"val":0.6235},{"hue":0.7427,"sat":0.717,"val":0.6235},{"hue":0.9927,"sat":0.717,"val":0.6235}],"hues":[0.743,0.493,0.997,0.743,0.997,0.493,0.743,0.493,0.997,0.493,0.743,0.997],"firstSwap":183,"every":2,"segment":{"mapping":"arc","tail":0.25,"shift":{"0.743":0.25,"0.493":0.25,"0.997":-0.504}}}, 'modifiers');

    beats(183.333333, 216, () => {
      cycle(0.666667, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ timed_hue: { offset_factor: { linear: { start: 0.015, end: 0 } } } })
          });
        });
      });
    })

    beats(183.333333, 216, () => {
      cycle(3.333333, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            brightness({ value: 0.5 })
          });
        });
      });
    })

    beats(183.333333, 186.666667, () => {
      cycle(0.333333, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_hue: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.3 } }, cyclic: true, offset_factor: { const_value: { value: 0.02 } } } })
          });
        });
      });
    })

    beats(186.666667, 190, () => {
      cycle(0.666667, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_hue: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.3 } }, cyclic: true, offset_factor: { const_value: { value: 0.02 } } } })
          });
        });
      });
    })

    beats(190, 216, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_hue: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.3 } }, cyclic: true, offset_factor: { const_value: { value: 0.02 } } } })
          });
        });
      });
    })

    beats(210, 216, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.2 } } } })
          addEffect({ timed_saturation: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } })
        });
      });
    })

    beats(188, 216, () => {
      cycle(1, () => {
        elements(even, () => {
          segment(segment_b1, () => {
            addEffect({ timed_brightness: { mult_factor_decrease: { half: { f1: { linear: { start: 1, end: 0.7 } }, f2: { linear: { start: 0.7, end: 0.35 } } } } } })
          });
        });
      });
    })

    beats(280, 328, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          addEffect({ position_hue: { offset_factor: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.63 } } } } } })
        });
      });
    })

    beats(280, 328, () => {
      cycle(3, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.15 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(280, 328, () => {
      cycle(4, () => {
        elements(odd, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(282, 328, () => {
      cycle(4, () => {
        elements(even, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(328, 392, () => {
      elements(all, () => {
        segment(segment_updown, () => {
          addEffect({ position_hue: { offset_factor: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.15 } } } } } })
        });
      });
    })

    beats(328, 392, () => {
      cycle(3, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 1, end: 0 } }, tail_length: { const_value: { value: 0.15 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(328, 392, () => {
      cycle(4, () => {
        elements(odd, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(330, 392, () => {
      cycle(4, () => {
        elements(even, () => {
          segment(segment_all, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 0.9, end: 0 } } } })
          });
        });
      });
    })

    beats(312, 328, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 4, diff_per_step: 0.0778, first_step_value: 0.3 } } } })
        });
      });
    })

    beats(328, 352, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 6, diff_per_step: 0.0778, first_step_value: 0.6111 } } } })
        });
      });
    })

    beats(352, 392, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 10, diff_per_step: -0.0778, first_step_value: 1 } } } })
        });
      });
    })

    beats(392, 504, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_hue: { offset_factor: { half: { f1: { half: { f1: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.63 } } } }, f2: { half: { f1: { const_value: { value: 0.63 } }, f2: { const_value: { value: 0 } } } } } }, f2: { half: { f1: { const_value: { value: 0.63 } }, f2: { const_value: { value: 0 } } } } } } } })
          });
        });
      });
    })

    beats(504, 520, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_hue: { offset_factor: { half: { f1: { half: { f1: { half: { f1: { const_value: { value: 0 } }, f2: { const_value: { value: 0.85 } } } }, f2: { half: { f1: { const_value: { value: 0.85 } }, f2: { const_value: { value: 0 } } } } } }, f2: { half: { f1: { const_value: { value: 0.85 } }, f2: { const_value: { value: 0 } } } } } } } })
          });
        });
      });
    })

    beats(392, 504, () => {
      elements(all, () => {
        segment(segment_all, () => {
          hueShiftStartToEnd({ start: 0, end: -0.8 })
          addEffect({ timed_saturation: { mult_factor_decrease: { steps: { num_steps: 28, diff_per_step: 0.0278, first_step_value: 0.25 } } } })
        });
      });
    })

    beats(508, 520, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(16, 48, () => {
      cycle(8, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(12, 48, () => {
      cycle(8, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(8, 48, () => {
      cycle(8, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(4, 48, () => {
      cycle(8, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 48, () => {
      cycle(8, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 48, () => {
      cycle(8, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(4, 48, () => {
      cycle(8, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(8, 48, () => {
      cycle(8, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(12, 48, () => {
      cycle(8, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(16, 48, () => {
      cycle(8, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(20, 48, () => {
      cycle(8, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(20, 48, () => {
      cycle(8, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(80, 96, () => {
      cycle(2.666667, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(72, 96, () => {
      cycle(2.666667, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(64, 96, () => {
      cycle(2.666667, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(56, 96, () => {
      cycle(2.666667, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(48, 96, () => {
      cycle(2.666667, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(48, 96, () => {
      cycle(2.666667, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(56, 96, () => {
      cycle(2.666667, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(64, 96, () => {
      cycle(2.666667, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(72, 96, () => {
      cycle(2.666667, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(80, 96, () => {
      cycle(2.666667, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(88, 96, () => {
      cycle(2.666667, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(88, 96, () => {
      cycle(2.666667, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(96, 149.333333, () => {
      cycle(2.666667, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(149.333333, 152, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            staticSnake({ start: 1, end: 0.65 })
          });
        });
      });
    })

    beats(152, 165.333333, () => {
      cycle(2.666667, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(1, () => {
              snake({ tailLength: 0.35, cyclic: true, reverse: false })
            });
          });
        });
      });
    })

    beats(165.333333, 168, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            snakeTurn({ tailLength: 0.35, speed: 1, cyclic: true })
          });
        });
      });
    })

    beats(168, 183.333333, () => {
      cycle(2.666667, () => {
        elements(all, () => {
          segment(segment_all, () => {
            phase(1, () => {
              snake({ tailLength: 0.35, cyclic: true, reverse: true })
            });
          });
        });
      });
    })

    beats(183.333333, 216, () => {
      cycle(3.333333, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            snakeSlowFast({ tailLength: 1 })
          });
        });
      });
    })

    beats(280, 328, () => {
      cycle(12, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            snakeHeadSteps({ steps: 12, tailLength: 0.25 })
          });
        });
      });
    })

    beats(280, 328, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            phase(1, () => {
              snake({ tailLength: 0.15, cyclic: true, reverse: false })
            });
          });
        });
      });
    })

    beats(328, 392, () => {
      cycle(12, () => {
        elements(all, () => {
          segment(segment_ind, () => {
            snakeHeadSteps({ steps: 12, tailLength: 0.25 })
          });
        });
      });
    })

    beats(328, 392, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            phase(1, () => {
              snake({ tailLength: 0.15, cyclic: true, reverse: true })
            });
          });
        });
      });
    })

    beats(392, 504, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            phase(0.5, () => {
              snakeInOut()
            });
          });
        });
      });
    })

    beats(504, 520, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            phase(0.5, () => {
              snakeInOut()
            });
          });
        });
      });
    })

    beats(149.333333, 152, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          addEffect({ timed_brightness: { mult_factor_increase: { const_value: { value: 1 } } } })
        });
      });
    })

    beats(149.333333, 152, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { sin: { min: 0, max: 2, phase: 0.75, repeats: 0.25 } } } })
        });
      });
    })

    beats(152, 183.333333, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(152, 183.333333, () => {
      cycleBeats(1, 0, 0.5, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            addEffect({ timed_brightness: { mult_factor_increase: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(152, 183.333333, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(149.333333, 183.333333, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0.7 } } } })
        });
      });
    })

    beats(183.333333, 186.666667, () => {
      cycle(0.666667, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(186.666667, 190, () => {
      cycle(0.833333, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(190, 216, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_all, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.2 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 0.8 } } } })
          });
        });
      });
    })

    beats(183.333333, 216, () => {
      cycleBeats(1.333333, 0, 0.666667, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_brightness: { mult_factor_decrease: { half: { f1: { const_value: { value: 1 } }, f2: { const_value: { value: 0.5 } } } } } })
          });
        });
      });
    })

    beats(183.333333, 216, () => {
      cycleBeats(1.333333, 0.666667, 1.333333, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_brightness: { mult_factor_decrease: { half: { f1: { const_value: { value: 0.5 } }, f2: { const_value: { value: 1 } } } } } })
          });
        });
      });
    })

    beats(183.333333, 186.666667, () => {
      cycle(0.666667, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.35 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(186.666667, 190, () => {
      cycle(0.833333, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.35 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(190, 216, () => {
      cycle(1, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.35 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(183.333333, 192, () => {
      cycle(8, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(192, 216, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.25 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })

    beats(183.333333, 188, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
            addEffect({ snake_saturation: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 0.1 } }, cyclic: true, mult_factor_decrease: { linear: { start: 1, end: 0.3 } } } })
          });
        });
      });
    })
  });

  labSection(anim, 216, 280, {"palette":"rebuild","mix":[{"texture":"stars-tinted","mapping":"rand"},{"texture":"stars-burst","mapping":"rand"},{"texture":"comet","mapping":"arc"},{"texture":"galaxy","mapping":"centric"},{"texture":"nebula","mapping":"rad"},{"texture":"horizon","mapping":"rad"},{"texture":"rad-stripes","mapping":"rad"},{"texture":"drip","mapping":"updown"}],"barsEach":2,"transition":"streak","shape":{"buildUp":true,"fadeOut":true,"peak":true,"peakOffset":2},"shuffleColors":true});
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
