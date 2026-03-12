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

const aladdin = async () => {
  const anim = new Animation("aladdin", 64.725, 79.00, 3575);
  anim.sync(() => {
    beats(0, 16, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(8, 16, () => {
      elements(center, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.7503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(16, 24, () => {
      elements(left, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(16, 16, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(16, 17, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(16, 18, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(16, 19, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(16, 20, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(16, 21, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 32, () => {
      elements(right, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(24, 24, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 25, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 26, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 27, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 28, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(24, 29, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(31.5, 32, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.6, 32.1, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.7, 32.3, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.9, 32.4, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32, 32.5, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.1, 32.6, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.3, 32.7, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.4, 32.9, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.5, 33, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.6, 33.1, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.7, 33.3, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.9, 33.4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(33.5, 34, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.6, 34.1, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.7, 34.3, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.9, 34.4, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34, 34.5, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.1, 34.6, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.3, 34.7, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.4, 34.9, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.5, 35, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.6, 35.1, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.7, 35.3, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.9, 35.4, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(35.5, 38.5, () => {
      elements(even, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(36.5, 38.5, () => {
      elements(odd, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6601, sat: 0.4980, val: 1.0000 })
        });
      });
    })

    beats(38.5, 48, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(38.5, 48, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.7998, sat: 0.8000, val: 1.0000 })
        });
      });
    })

    beats(38.5, 39.5, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(41.5, 42.5, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(43.5, 43.7, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(43.7, 44, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(44, 44.3, () => {
      elements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(44.3, 44.5, () => {
      elements([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(44.5, 44.7, () => {
      elements([1, 3, 4, 5, 6, 7, 8, 9, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(44.7, 45, () => {
      elements([1, 2, 3, 4, 5, 6, 8, 9, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(45, 45.3, () => {
      elements([1, 2, 3, 4, 6, 7, 8, 9, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(45.3, 45.5, () => {
      elements([1, 2, 3, 4, 6, 7, 8, 10, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(45.5, 45.7, () => {
      elements([1, 2, 3, 4, 5, 7, 10, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(45.7, 46, () => {
      elements([1, 4, 5, 6, 8, 10, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(46, 46.3, () => {
      elements([1, 2, 3, 4, 7, 8, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(46.3, 46.5, () => {
      elements([1, 3, 4, 6, 9, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(46.5, 46.7, () => {
      elements([2, 3, 4, 6, 10, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(46.7, 47, () => {
      elements([1, 2, 5, 6, 7, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(47, 47.3, () => {
      elements([1, 3, 5, 7, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(47.3, 47.5, () => {
      elements([2, 3, 6, 11, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(47.5, 47.7, () => {
      elements([2, 7, 9, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(47.7, 48, () => {
      elements([3, 7, 10, 12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.0000 })
        });
      });
    })

    beats(48.5, 50, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(50, 57, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6601, sat: 0.6980, val: 1.0000 })
        });
      });
    })

    beats(57, 59, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.1002, sat: 0.6980, val: 1.0000 })
        });
      });
    })

    beats(59, 64, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(62, 64, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            constColor({ hue: 0.0495, sat: 1.0000, val: 0.5020 })
          });
        });
      });
    })

    beats(64, 66, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(66, 73, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6597, sat: 0.7010, val: 0.8000 })
        });
      });
    })

    beats(70, 73, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.0000, val: 0.8000 })
        });
      });
    })

    beats(73, 75, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
          });
        });
      });
    })

    beats(75, 87, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.0000, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(0, 16, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.05 } } } })
        });
      });
    })

    beats(0, 1, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(8, 16, () => {
      elements(center, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.23 } } } })
        });
      });
    })

    beats(7, 9, () => {
      elements(center, () => {
        segment(segment_all, () => {
          fadeOutIn()
        });
      });
    })

    beats(15, 16, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(16, 18, () => {
      elements([1], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0, end: 0.2 })
        });
      });
    })

    beats(18, 24, () => {
      elements([1], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.2 })
        });
      });
    })

    beats(17, 19, () => {
      elements([2], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.2, end: 0.4 })
        });
      });
    })

    beats(19, 24, () => {
      elements([2], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.4 })
        });
      });
    })

    beats(18, 20, () => {
      elements([3], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.4, end: 0.6 })
        });
      });
    })

    beats(20, 24, () => {
      elements([3], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.6 })
        });
      });
    })

    beats(19, 21, () => {
      elements([4], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.6, end: 0.8 })
        });
      });
    })

    beats(21, 24, () => {
      elements([4], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.8 })
        });
      });
    })

    beats(20, 22, () => {
      elements([5], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.8, end: 1 })
        });
      });
    })

    beats(22, 24, () => {
      elements([5], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1 })
        });
      });
    })

    beats(21, 23, () => {
      elements([6], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 1, end: 1.2 })
        });
      });
    })

    beats(23, 24, () => {
      elements([6], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1.2 })
        });
      });
    })

    beats(24, 26, () => {
      elements([12], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0, end: 0.2 })
        });
      });
    })

    beats(26, 32, () => {
      elements([12], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.2 })
        });
      });
    })

    beats(25, 27, () => {
      elements([11], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.2, end: 0.4 })
        });
      });
    })

    beats(27, 32, () => {
      elements([11], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.4 })
        });
      });
    })

    beats(26, 28, () => {
      elements([10], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.4, end: 0.6 })
        });
      });
    })

    beats(28, 32, () => {
      elements([10], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.6 })
        });
      });
    })

    beats(27, 29, () => {
      elements([9], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.6, end: 0.8 })
        });
      });
    })

    beats(29, 32, () => {
      elements([9], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.8 })
        });
      });
    })

    beats(28, 30, () => {
      elements([8], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 0.8, end: 1 })
        });
      });
    })

    beats(30, 32, () => {
      elements([8], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1 })
        });
      });
    })

    beats(29, 31, () => {
      elements([7], () => {
        segment(segment_arc, () => {
          hueShiftStartToEnd({ start: 1, end: 1.2 })
        });
      });
    })

    beats(31, 32, () => {
      elements([7], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1.2 })
        });
      });
    })

    beats(31, 32, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(31.5, 32, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.6, 32.1, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.7, 32.3, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.9, 32.4, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32, 32.5, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.1, 32.6, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.3, 32.7, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.4, 32.9, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.5, 33, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.6, 33.1, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.7, 33.3, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.9, 33.4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(33.5, 34, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.6, 34.1, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.7, 34.3, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.9, 34.4, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34, 34.5, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.1, 34.6, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.3, 34.7, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.4, 34.9, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.5, 35, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.6, 35.1, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.7, 35.3, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.9, 35.4, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(35.5, 36.5, () => {
      elements(even, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(36.5, 37.5, () => {
      elements(odd, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(37.5, 38, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fade({ start: 1, end: 0.3 })
        });
      });
    })

    beats(38, 38.5, () => {
      elements(all, () => {
        segment(segment_all, () => {
          brightness({ value: 0.5 })
        });
      });
    })

    beats(38.5, 39.5, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          fadeIn()
        });
      });
    })

    beats(39.5, 40.5, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          fadeIn()
        });
      });
    })

    beats(40.5, 41.5, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          fadeOut()
        });
      });
    })

    beats(41.5, 42.5, () => {
      elements(all, () => {
        segment(segment_b2, () => {
          fadeOut()
        });
      });
    })

    beats(42.5, 48, () => {
      elements(all, () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.8 })
        });
      });
    })

    beats(42.5, 43, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(48.5, 50, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } })
          brightness({ value: 0.6 })
        });
      });
    })

    beats(49, 50, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(49, 50, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            hueShiftStartToEnd({ start: 0, end: 1 })
          });
        });
      });
    })

    beats(53, 54, () => {
      elements(all, () => {
        segment(segment_all, () => {
          hueShiftStartToEnd({ start: 0, end: 0.4 })
        });
      });
    })

    beats(54, 57, () => {
      elements(all, () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.4 })
        });
      });
    })

    beats(56, 57, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(50, 57, () => {
      cycle(0.6, () => {
        elements(all, () => {
          segment(segment_all, () => {
            blink({ low: 0.8 })
          });
        });
      });
    })

    beats(59, 64, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.05 } } } })
        });
      });
    })

    beats(60, 62, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(62, 64, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            fadeOutIn()
          });
        });
      });
    })

    beats(64, 66, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } })
          brightness({ value: 0.6 })
        });
      });
    })

    beats(64.5, 66, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(64.5, 66, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            hueShiftStartToEnd({ start: 0, end: 1 })
          });
        });
      });
    })

    beats(69, 70, () => {
      elements(all, () => {
        segment(segment_all, () => {
          hueShiftStartToEnd({ start: 0, end: 0.3 })
        });
      });
    })

    beats(72, 73, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(65, 73, () => {
      cycle(0.3, () => {
        elements(all, () => {
          segment(segment_all, () => {
            blink({ low: 0.8 })
          });
        });
      });
    })

    beats(73, 75, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } })
          });
        });
      });
    })

    beats(75, 87, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    beats(81, 85, () => {
      elements(all, () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(0, 16, () => {
      cycle(12, () => {
        elements(all, () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.125, cyclic: true })
          });
        });
      });
    })

    beats(8, 16, () => {
      cycle(8, () => {
        elements(center, () => {
          segment(segment_arc, () => {
            snakeInOut()
          });
        });
      });
    })

    beats(16, 18, () => {
      elements([1], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(17, 19, () => {
      elements([2], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(18, 20, () => {
      elements([3], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(19, 21, () => {
      elements([4], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(20, 22, () => {
      elements([5], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(21, 23, () => {
      elements([6], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(24, 26, () => {
      elements([12], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(25, 27, () => {
      elements([11], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(26, 28, () => {
      elements([10], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(27, 29, () => {
      elements([9], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(28, 30, () => {
      elements([8], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(29, 31, () => {
      elements([7], () => {
        segment(segment_arc, () => {
          snakeFillGrow()
        });
      });
    })

    beats(42.5, 48, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_updown, () => {
            snake({ tailLength: 1, cyclic: true })
          });
        });
      });
    })

    beats(50, 53, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.98, end: 0.4 })
        });
      });
    })

    beats(53, 54, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          snakeHeadMove({ start: 0.98, end: 0.4, tail: 0.5 })
        });
      });
    })

    beats(54, 57, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.4, end: -0.2 })
        });
      });
    })

    beats(57, 59, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          snakeInOut()
        });
      });
    })

    beats(59, 64, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          snakeInOut()
        });
      });
    })

    beats(60, 62, () => {
      elements(all, () => {
        segment(segment_all, () => {
          snake({ tailLength: 0.4 })
        });
      });
    })

    beats(62, 64, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.3 })
          });
        });
      });
    })

    beats(66, 69, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.98, end: 0.4 })
        });
      });
    })

    beats(69, 70, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          snakeHeadMove({ start: 0.98, end: 0.4, tail: 0.5 })
        });
      });
    })

    beats(70, 73, () => {
      elements(all, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.4, end: -0.2 })
        });
      });
    })

    beats(73, 75, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_arc, () => {
            snakeInOut()
          });
        });
      });
    })

    beats(75, 87, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          snakeInOut()
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("aladdin", anim.getSequence());
  await startSong("aladdin", 0);
};

(async () => {
  await aladdin();
})();
