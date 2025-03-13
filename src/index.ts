import { Effect } from "./effects/types";
import { sendSequence, SequencePerThing } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycle, cycleBeats } from "./time/time";
import { constColor, noColor, rainbow, vivid } from "./effects/coloring";
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
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_updown,
} from "./objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeInOut,
  staticSnake,
} from "./effects/motion";
import { phase } from "./phase/phase";
import { hueShiftStartToEnd, staticHueShift } from "./effects/hue";

function getRandomSubset(numberRingsOn: number): number[] {
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]
  const indicesToRemove = new Set<number>();
  while (indicesToRemove.size < numberRingsOn) {
    indicesToRemove.add(Math.floor(Math.random() * 12));
  }
  return numbers.filter((_, index) => !indicesToRemove.has(index));
}

const turnOffRand = (numberRingsOn: number) => {
  elements(getRandomSubset(numberRingsOn), () => {
    noColor();
  });
};

const testSequence = async () => {
  const testAnimation = new Animation("aladdin", 64.725, 79, 575);
  testAnimation.sync(() => {
    beats(0, 16, () => {
      elements(all, () => {
        rainbow({ startHue: 0.05, endHue: 0.1 });
        cycle(12, () => {
          snake({ tailLength: 0.125, cyclic: true });
        });
      });
    });

    beats(8, 16, () => {
      elements(center, () => {
        segment(segment_arc, () => {
          rainbow({ startHue: 0.75, endHue: 0.98 });
          cycle(8, () => {
            snakeInOut();
          });
        });
      });
    });

    beats(7, 9, () => {
      elements(center, () => {
        fadeOutIn();
      });
    });

    beats(15, 16, () => {
      elements(all, () => {
        fadeOut();
      });
    });

    beats(16, 24, () => {
      elements(left, () => {
        constColor({ hue: 0.68, sat: 0.9, val: 1.0 });
      });
    });

    for (let i = 0; i < 6; i++) {
      elements([i + 1], () => {
        beats(16, 16 + i, () => {
          noColor();
        });
        segment(segment_arc, () => {
          beats(16 + i, 16 + i + 2, () => {
            hueShiftStartToEnd({ start: 0.2 * i, end: 0.2 * (i + 1) });
            snakeFillGrow();
          });
        });
        beats(16 + i + 2, 24, () => {
          staticHueShift({ value: 0.2 * (i + 1) });
        });
      });
    }

    beats(24, 32, () => {
      elements(right, () => {
        constColor({ hue: 0.68, sat: 0.9, val: 1.0 });
      });
    });

    for (let i = 0; i < 6; i++) {
      elements([12 - i], () => {
        beats(24, 24 + i, () => {
          noColor();
        });
        segment(segment_arc, () => {
          beats(24 + i, 24 + i + 2, () => {
            hueShiftStartToEnd({ start: 0.2 * i, end: 0.2 * (i + 1) });
            snakeFillGrow();
          });
        });
        beats(24 + i + 2, 32, () => {
          staticHueShift({ value: 0.2 * (i + 1) });
        });
      });
    }

    beats(31, 32, () => {
      elements(all, () => {
        fadeOut();
      });
    });

    // 31.5 - 33.5
    // when the wind's from the east
    for (let i = 0; i < 12; i++) {
      const rel = i / 12;
      beats(31.5 + rel * 1.5, 31.5 + rel * 1.5 + 0.5, () => {
        elements([i + 1], () => {
          constColor({ hue: 0.68, sat: 0.9, val: 1.0 });
          fadeInOut();
        });
      });
    }

    // 33.5 - 35.5
    // and the sun's from the west
    for (let i = 0; i < 12; i++) {
      const rel = i / 12;
      beats(33.5 + rel * 1.5, 33.5 + rel * 1.5 + 0.5, () => {
        elements([12 - i], () => {
          constColor({ hue: 0.05, sat: 0.95 });
          fadeOut();
        });
      });
    }

    // 35.5 - 37.5
    // and the sand in the glass is right
    // first beat fade in even rings in orange
    elements(even, () => {
      beats(35.5, 38.5, () => {
        vivid({ hue: 0.05 });
      });
      beats(35.5, 36.5, () => {
        fadeIn();
      });
    });
    // glass
    elements(odd, () => {
      beats(36.5, 38.5, () => {
        constColor({ hue: 0.66, sat: 0.5, val: 1.0 });
      });
      beats(36.5, 37.5, () => {
        fadeIn();
      });
    });
    // is right
    elements(all, () => {
      beats(37.5, 38.0, () => {
        fade({ start: 1.0, end: 0.3 });
      });
      beats(38.0, 38.5, () => {
        brightness({ value: 0.5 });
      });
    });

    // 39 - 40 come on
    // 40 - 40.5 down
    // 40.5 - 41.5 stop on by
    // 41.5 - 42.5 hop a carpet
    // 42.5 - 43 and fly
    // 43.5 - 46 to another Arabian night
    // 46 - 48 Ahuuuuuuuu
    elements(all, () => {
      // color for all
      beats(38.5, 48, () => {
        segment(segment_b1, () => {
          constColor({ hue: 0, val: 1.0 });
        });
        segment(segment_b2, () => {
          constColor({ hue: 0.8, sat: 0.8, val: 1.0 });
        });
      });
      beats(38.5, 39.5, () => {
        segment(segment_b2, () => {
          noColor();
        });
        segment(segment_b1, () => {
          fadeIn();
        });
      });
      // second beat b1 fade in
      beats(39.5, 40.5, () => {
        segment(segment_b2, () => {
          fadeIn();
        });
      });
      beats(40.5, 41.5, () => {
        segment(segment_b1, () => {
          fadeOut();
        });
      });
      beats(41.5, 42.5, () => {
        segment(segment_b2, () => {
          fadeOut();
        });
        segment(segment_b1, () => {
          noColor();
        });
      });
      beats(42.5, 48, () => {
        staticHueShift({ value: 0.8 });
        segment(segment_updown, () => {
          cycle(0.25, () => {
            snake({ tailLength: 1.0, cyclic: true });
          });
        });
      });
      beats(42.5, 43, () => {
        fadeIn();
      });
    });
    for (let i = 0; i < 18; i++) {
      beats(43.5 + i * 0.25, 43.5 + i * 0.25 + 0.25, () => {
        turnOffRand(Math.floor(i / 2));
      });
    }

    elements(all, () => {
      // boom
      beats(48.5, 50, () => {
        segment(segment_arc, () => {
          rainbow();
          brightness({ value: 0.6 });
        });
      });
      // boom fade out and psychedelic
      beats(49, 50, () => {
        fadeOut();
        cycle(0.25, () => {
          hueShiftStartToEnd({ start: 0.0, end: 1.0 });
        });
      });

      // 50 - 53 - Arabian nights
      // 53 - 57 - like Arabian days
      beats(50, 57, () => {
        constColor({ hue: 0.66, sat: 0.7, val: 1.0 });
      });
      beats(50, 53, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.98, end: 0.4 });
        });
      });
      beats(53, 54, () => {
        hueShiftStartToEnd({ start: 0.0, end: 0.4 });
        segment(segment_ind, () => {
          snakeHeadMove({ start: 0.98, end: 0.4, tail: 0.5 });
        });
      });
      beats(54, 57, () => {
        staticHueShift({ value: 0.4 });
        segment(segment_ind, () => {
          staticSnake({ start: 0.4, end: -0.2 });
        });
      });
      beats(56, 57, () => {
        fadeOut();
      });
      beats(50, 57, () => {
        cycle(0.6, () => {
          blink({ low: 0.8 });
        });
      });
    });

    elements(all, () => {
      // more often than not
      beats(57, 59, () => {
        segment(segment_arc, () => {
          // rainbow({ startHue: 0.7, endHue: 1.0 });
          constColor({ hue: 0.1, sat: 0.7, val: 1.0 });
          snakeInOut();
        });
      });
      // are hotter than hot
      beats(59, 64, () => {
        segment(segment_arc, () => {
          rainbow({ startHue: 0.0, endHue: 0.05 });
          // constColor({ hue: 0.0, sat: 1.0, val: 1.0 });
          snakeInOut();
        });
      });
      // in a lot of good ways
      beats(60, 62, () => {
        snake({ tailLength: 0.4 });
        fadeInOut();
      });
      beats(62, 64, () => {
        cycle(0.25, () => {
          constColor({ hue: 0.05, sat: 1.0, val: 0.5 });
          snake({ tailLength: 0.3 });
          fadeOutIn();
        });
      });
    });

    elements(all, () => {
      // boom
      beats(64, 66, () => {
        segment(segment_arc, () => {
          rainbow();
          brightness({ value: 0.6 });
        });
      });
      // boom fade out and psychedelic
      beats(64.5, 66, () => {
        fadeOut();
        cycle(0.25, () => {
          hueShiftStartToEnd({ start: 0.0, end: 1.0 });
        });
      });
    });

    elements(all, () => {
      beats(66, 73, () => {
        constColor({ hue: 0.66, sat: 0.7, val: 0.8 });
      });

      beats(66, 69, () => {
        segment(segment_ind, () => {
          staticSnake({ start: 0.98, end: 0.4 });
        });
      });
      beats(69, 70, () => {
        hueShiftStartToEnd({ start: 0.0, end: 0.3 });
        segment(segment_ind, () => {
          snakeHeadMove({ start: 0.98, end: 0.4, tail: 0.5 });
        });
      });
      // like arabian moons
      beats(70, 73, () => {
        constColor({ hue: 0.66, sat: 0.0, val: 0.8 });
        segment(segment_ind, () => {
          staticSnake({ start: 0.4, end: -0.2 });
        });
      });
      beats(72, 73, () => {
        fadeOut();
      });
      beats(65, 73, () => {
        cycle(0.3, () => {
          blink({ low: 0.8 });
        });
      });
    });
  });

  console.log("sending sequence");
  await sendSequence("aladdin", testAnimation.getSequence());
  await startSong("aladdin", 0);
};

(async () => {
  await testSequence();
})();
