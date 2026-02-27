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

const loop = async () => {
  const anim = new Animation("loop", 118, 245.00, 0);
  anim.sync(() => {
    beats(0, 4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(4, 8, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(8, 12, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(12, 16, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(16, 19, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(19, 22, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(22, 25, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
        });
      });
    })

    beats(4, 43, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(8, 40, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(12, 37, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(16, 34, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(19, 31, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(22, 28, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(25, 28, () => {
      elements([6], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
        });
      });
    })

    beats(28, 31, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
        });
      });
    })

    beats(31, 34, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
        });
      });
    })

    beats(34, 37, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
        });
      });
    })

    beats(37, 40, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
        });
      });
    })

    beats(40, 43, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
        });
      });
    })

    beats(43, 46, () => {
      elements([12], () => {
        segment(segment_all, () => {
          constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.0000, sat: 0.7155, val: 0.9373 })
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.6034, sat: 0.7602, val: 0.9647 })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.7175, sat: 0.6260, val: 0.9647 })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.9177, sat: 0.6949, val: 0.9255 })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.1047, sat: 0.9551, val: 0.9608 })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.4448, sat: 0.9135, val: 0.7255 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            constColor({ hue: 0.5243, sat: 0.9717, val: 0.8314 })
          });
        });
      });
    })

    beats(67, 83, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(67, 83, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(83, 84, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(84, 102, () => {
      elements(all, () => {
        segment(segment_all, () => {
          constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
        });
      });
    })

    beats(84, 102, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            constColor({ hue: 0.7521, sat: 0.6559, val: 0.9686 })
          });
        });
      });
    })

    beats(0, 4, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(4, 8, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(8, 12, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(12, 16, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(16, 19, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(19, 22, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(22, 25, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeIn()
        });
      });
    })

    beats(4, 43, () => {
      elements([12], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(8, 40, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(12, 37, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(16, 34, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(19, 31, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(22, 28, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          brightness({ value: 1 })
        });
      });
    })

    beats(25, 28, () => {
      elements([6], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(28, 31, () => {
      elements([5, 7], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(31, 34, () => {
      elements([4, 8], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(34, 37, () => {
      elements([3, 9], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(37, 40, () => {
      elements([2, 10], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(40, 43, () => {
      elements([1, 11], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(43, 46, () => {
      elements([12], () => {
        segment(segment_all, () => {
          fadeOut()
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            fadeIn()
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            brightness({ value: 1 })
          });
        });
      });
    })

    beats(67, 83, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 9, diff_per_step: 0.083, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(83, 84, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            pulse({ low: 0 })
          });
        });
      });
    })

    beats(84, 102, () => {
      elements(all, () => {
        segment(segment_all, () => {
          phase(1, () => {
            addEffect({ timed_hue: { offset_factor: { steps: { num_steps: 9, diff_per_step: 0.083, first_step_value: 0 } } } })
          });
        });
      });
    })

    beats(46, 49, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(49, 52, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(52, 55, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(55, 58, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(58, 61, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(61, 64, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([6], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(49, 67, () => {
      cycle(3, () => {
        elements([12], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(52, 67, () => {
      cycle(3, () => {
        elements([1, 11], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(55, 67, () => {
      cycle(3, () => {
        elements([2, 10], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(58, 67, () => {
      cycle(3, () => {
        elements([3, 9], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(61, 67, () => {
      cycle(3, () => {
        elements([4, 8], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(64, 67, () => {
      cycle(3, () => {
        elements([5, 7], () => {
          segment(segment_all, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(67, 83, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_centric, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })

    beats(83, 84, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          phase(1, () => {
            snake({ tailLength: 0.3, cyclic: true })
          });
        });
      });
    })

    beats(84, 102, () => {
      cycle(2, () => {
        elements(all, () => {
          segment(segment_rand, () => {
            snake({ tailLength: 0.5, cyclic: true })
          });
        });
      });
    })
  });

  console.log("sending sequence");
  await sendSequence("loop", anim.getSequence());
  await startSong("loop", 0);
};

(async () => {
  await loop();
})();
