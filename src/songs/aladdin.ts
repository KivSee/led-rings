// Generated from Timeline Manager.
import { sendSequence } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats, section } from "../time/time";
import { optionEffects as bars5Effects } from "./aladdin-bars5-snakes";
import { patternEffects as beats36Pattern } from "./aladdin-beats36-options";
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

// The gallery option used for bars 5-8: the coloring picked (aladdin-bars5-options.ts, card 89) with the snake picked
// over it (aladdin-bars5-snakes.ts, card 16; its index in OPTIONS there, after the "as it is now" card).
const BARS5_PICKED = 14;
// The pattern used for beats 36-39 (its index in OPTIONS of aladdin-beats36-options.ts): 2 shadows spinning round
// the small rings, the halves mirrored, a lap a beat.
const BEATS36_PICKED = 0;

const aladdin = async () => {
  const anim = new Animation("aladdin", 64.725, 78.91, 575);
  // Play once (the rings stay dark after it), the length of the audio, so the start does not come round again.
  anim.playOnce();
  anim.sync(() => {
    // The song's parts, in its episodes of 8 beats (aladdin-episode.txt), named by how the music builds: quiet
    // intro, rising, louder still, the lights' busiest build, the loudest peak, coming down, the quiet ending. Markers
    // only (for the Sequence Player): the effects below are placed by their own beats.
    const SECTIONS: [string, number, number][] = [
      ["intro", 0, 8], ["verse", 8, 24], ["rise", 24, 32], ["build", 32, 48], ["peak", 48, 72], ["come down", 72, 80], ["ending", 80, 82],
    ];
    SECTIONS.forEach(([name, start, end]) => section(name, { start, end }, () => {}));

    beats(0, 16, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    beats(8, 16, () => {
      elements(bottom, () => {
        segment(segment_arc, () => {
          constColor({ hue: 0.7503, sat: 1.0000, val: 1.0000 })
        });
      });
    })

    // Bars 5-8 (beats 16-30), picked in the gallery (ui/background-gallery.html?set=aladdin_bars5,
    // src/songs/aladdin-bars5-options.ts): option 89, in desert colors. Part 1 (16-22): the mirror pairs from the top
    // down, terracotta, in rings along rad; the stop (22-24): fading out; part 2 (24-30): the pairs from the bottom up,
    // golden sand, the rings along rad turned once round the big ring. Over it, while the rings are lit (ui/background-gallery.html?set=
    // aladdin_bars5_snake): a soft shadow spiralling on updown, mirrored left and right, a lap every 3 beats.
    bars5Effects(BARS5_PICKED);

    // Beats 31.5-35.5: a ring chasing round the big ring, clockwise from ring 12 (the first ring, at the top) to 11,
    // then back from 11 to 12.

    beats(31.5, 32, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.6, 32.1, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.7, 32.3, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(31.9, 32.4, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32, 32.5, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.1, 32.6, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.3, 32.7, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.4, 32.9, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.5, 33, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.6, 33.1, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.7, 33.3, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(32.9, 33.4, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6804, sat: 0.9020, val: 1.0000 })
        });
      });
    })

    beats(33.5, 34, () => {
      elements([11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.6, 34.1, () => {
      elements([10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.7, 34.3, () => {
      elements([9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(33.9, 34.4, () => {
      elements([8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34, 34.5, () => {
      elements([7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.1, 34.6, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.3, 34.7, () => {
      elements([5], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.4, 34.9, () => {
      elements([4], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.5, 35, () => {
      elements([3], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.6, 35.1, () => {
      elements([2], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.7, 35.3, () => {
      elements([1], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0496, sat: 0.9490, val: 1.0000 })
        });
      });
    })

    beats(34.9, 35.4, () => {
      elements([12], () => {
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

    // Beats 41.5-42.5: no dark moment before the next part: the b1 dots come back in while the b2 ones stay lit, so the
    // scene is at full when the snake on updown starts at 42.5.
    beats(41.5, 42.5, () => {
      elements(all, () => {
        segment(segment_b1, () => {
          fadeIn()
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
      elements(bottom, () => {
        segment(segment_arc, () => {
          addEffect({ position_hue: { offset_factor: { linear: { start: 0, end: 0.23 } } } })
        });
      });
    })

    beats(7, 9, () => {
      elements(bottom, () => {
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

    beats(30, 32, () => {
      elements([4], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1 })
        });
      });
    })

    beats(31, 32, () => {
      elements([5], () => {
        segment(segment_all, () => {
          staticHueShift({ value: 1.2 })
        });
      });
    })


    beats(31.5, 32, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.6, 32.1, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.7, 32.3, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(31.9, 32.4, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32, 32.5, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.1, 32.6, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.3, 32.7, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.4, 32.9, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.5, 33, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.6, 33.1, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.7, 33.3, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(32.9, 33.4, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeInOut()
        });
      });
    })

    beats(33.5, 34, () => {
      elements([11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.6, 34.1, () => {
      elements([10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.7, 34.3, () => {
      elements([9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(33.9, 34.4, () => {
      elements([8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34, 34.5, () => {
      elements([7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.1, 34.6, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.3, 34.7, () => {
      elements([5], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.4, 34.9, () => {
      elements([4], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.5, 35, () => {
      elements([3], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.6, 35.1, () => {
      elements([2], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.7, 35.3, () => {
      elements([1], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34.9, 35.4, () => {
      elements([12], () => {
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


    // "Fly" (beat 42.5): the hue slides over the first beat to the part's shift of 0.8 (the short way round, -0.2),
    // instead of jumping to it.
    beats(42.5, 43.5, () => {
      elements(all, () => {
        segment(segment_all, () => {
          addEffect({ timed_hue: { offset_factor: { linear: { start: 0, end: -0.2 } } } })
        });
      });
    })

    beats(43.5, 48, () => {
      elements(all, () => {
        segment(segment_all, () => {
          staticHueShift({ value: 0.8 })
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
        elements(bottom, () => {
          segment(segment_arc, () => {
            snakeInOut()
          });
        });
      });
    })

    // The "fly" sweep: a ramp of light round every ring on updown, 4 times a beat. Over its first beat it deepens a
    // quarter at a time (the ramp's dark end at 3/4, 1/2, 1/4, then 0 of the light), so it grows in rather than
    // switching on.
    for (const [k, low] of [0.75, 0.5, 0.25, 0].entries()) {
      beats(42.5 + k / 4, 42.75 + k / 4, () => {
        elements(all, () => {
          segment(segment_updown, () => {
            addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 1 } }, cyclic: true, mult_factor_decrease: { linear: { start: low, end: 1 } } } })
          });
        });
      });
    }

    beats(43.5, 48, () => {
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

    // Beats 59-64: a snake swinging out and back round every small ring (arc, its head on a sin), lighting what it
    // passes to full over the rest dimmed to ARC_LOW, rather than blacking out everything outside it.
    const ARC_LOW = 0.35;
    beats(59, 64, () => {
      elements(all, () => {
        segment(segment_arc, () => {
          addEffect({ timed_brightness: { mult_factor_decrease: { const_value: { value: ARC_LOW } } } })
          addEffect({ snake_brightness: { head: { sin: { min: 0, max: 1, phase: 0, repeats: 1 } }, tail_length: { const_value: { value: 0.5 } }, cyclic: false, mult_factor_increase: { linear: { start: 0, end: 1 } } } })
        });
      });
    })

    // Bar 16: a snake of light running round every ring, its head at full and the rest of the ring dimmed to
    // BAR16_LOW behind it, rather than blacked out, so most of the ring stays lit.
    const BAR16_LOW = 0.25;
    const bar16Snake = () => addEffect({ snake_brightness: { head: { linear: { start: 0, end: 1 } }, tail_length: { const_value: { value: 1 } }, cyclic: true, mult_factor_decrease: { linear: { start: BAR16_LOW, end: 1 } } } });
    beats(60, 62, () => {
      elements(all, () => {
        segment(segment_all, () => {
          bar16Snake()
        });
      });
    })

    beats(62, 64, () => {
      cycle(0.25, () => {
        elements(all, () => {
          segment(segment_all, () => {
            bar16Snake()
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

    // Beats 36-39, over the colors (the even rings orange, the odd ones pale blue, then the red dots), last so it
    // only changes them a little: the pattern picked in the gallery (ui/background-gallery.html?set=aladdin_beats36,
    // src/songs/aladdin-beats36-options.ts). ALADDIN_BEATS36=none leaves it out (the gallery's base).
    if (process.env.ALADDIN_BEATS36 !== "none") beats36Pattern(BEATS36_PICKED);
  });

  console.log("sending sequence");
  await sendSequence("aladdin", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("aladdin", 0);
  }
};

(async () => {
  await aladdin();
})();
