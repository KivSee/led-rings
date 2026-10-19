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

const inequal = async () => {
  const anim = new Animation("inequal", 150, 312.00, 0);
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

    beats(72, 228, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
        });
      });
    })

    beats(72, 228, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          phase(0.8333, () => {
            constColor({ hue: 0.1667, sat: 0.8545, val: 0.8353 })
          });
        });
      });
    })

    beats(72, 228, () => {
      elements(left, () => {
        segment(segment_b1, () => {
          phase(-1, () => {
            constColor({ hue: 0.0000, sat: 0.8545, val: 0.8353 })
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

    beats(228, 274, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.5293, sat: 0.9479, val: 0.7529 })
          });
        });
      });
    })

    beats(228, 274, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.1146, sat: 0.1333, val: 0.4706 })
          });
        });
      });
    })

    beats(0, 12, () => {
      elements([1], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 24, () => {
      elements([2], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 36, () => {
      elements([3], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 72, () => {
      cycle(12, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 48, () => {
      elements([4], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(48, 72, () => {
      cycle(12, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 60, () => {
      elements([5], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(60, 72, () => {
      cycle(12, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 60, () => {
      elements([6], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(60, 72, () => {
      cycle(12, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 48, () => {
      elements([7], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(48, 72, () => {
      cycle(12, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 36, () => {
      elements([8], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(36, 72, () => {
      cycle(12, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 24, () => {
      elements([9], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 12, () => {
      elements([10], () => {
        segment(segment_rand, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 72, () => {
      cycle(12, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
        });
      });
    })

    beats(0, 72, () => {
      cycle(12, () => {
        elements([12], () => {
          segment(segment_rand, () => {
            fadeInOut({ high: 1 })
          });
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
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(108, 144, () => {
      elements([2], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(96, 144, () => {
      elements([3], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(84, 144, () => {
      elements([4], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(72, 144, () => {
      elements([5], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(72, 144, () => {
      elements([6], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(84, 144, () => {
      elements([7], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(96, 144, () => {
      elements([8], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(108, 144, () => {
      elements([9], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(120, 144, () => {
      elements([10], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(132, 144, () => {
      elements([11], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(132, 144, () => {
      elements([12], () => {
        segment(segment_centric, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(110, 144, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.25 })
          });
        });
      });
    })

    beats(72, 228, () => {
      elements([12], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
        });
      });
    })

    beats(72, 228, () => {
      elements([1, 2, 3, 4, 5], () => {
        segment(segment_b1, () => {
          addEffect({ timed_hue: { offset_factor: { const_value: { value: 0 } } } })
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

    beats(216, 228, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_b1, () => {
            pulse({ low: 0.5, staticPhase: 0 })
          });
        });
      });
    })

    beats(192, 216, () => {
      elements([1], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(180, 216, () => {
      elements([2], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(168, 216, () => {
      elements([3], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(156, 216, () => {
      elements([4], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(144, 216, () => {
      elements([5], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(144, 216, () => {
      elements([6], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(156, 216, () => {
      elements([7], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(168, 216, () => {
      elements([8], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(180, 216, () => {
      elements([9], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(192, 216, () => {
      elements([10], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(204, 216, () => {
      elements([11], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(204, 216, () => {
      elements([12], () => {
        segment(segment_b2, () => {
          fade({ start: 0.2, end: 1 })
        });
      });
    })

    beats(144, 198, () => {
      cycle(6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0.75 })
          });
        });
      });
    })

    beats(198, 216, () => {
      cycle(3, () => {
        elements(all, () => {
          segment(segment_all, () => {
            pulse({ low: 0.25, staticPhase: 0 })
          });
        });
      });
    })

    beats(216, 228, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(228, 274, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ snake_brightness: { head: { steps: { num_steps: 4, diff_per_step: 0.25, first_step_value: 0 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: false, mult_factor_decrease: { linear: { start: 1, end: 0 } } } })
          });
        });
      });
    })

    beats(228, 274, () => {
      cycle(4, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 4, diff_per_step: 0.25, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([1], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([2], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(36, 72, () => {
      cycle(12, () => {
        elements([3], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(48, 72, () => {
      cycle(12, () => {
        elements([4], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(60, 72, () => {
      cycle(12, () => {
        elements([5], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(60, 72, () => {
      cycle(12, () => {
        elements([6], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(48, 72, () => {
      cycle(12, () => {
        elements([7], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(36, 72, () => {
      cycle(12, () => {
        elements([8], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(24, 72, () => {
      cycle(12, () => {
        elements([9], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(12, 72, () => {
      cycle(12, () => {
        elements([10], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 72, () => {
      cycle(12, () => {
        elements([11], () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: false })
          });
        });
      });
    })

    beats(0, 72, () => {
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
  });

  console.log("sending sequence");
  await sendSequence("inequal", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("inequal", 0);
  }
};

(async () => {
  await inequal();
})();
