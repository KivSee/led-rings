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
  segment_rand,
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

const ringParty = (i: number) => {
  switch (i % 4) {
    case 0:
      segment(segment_arc, () => {
        rainbow();
        hueShiftStartToEnd({ start: 0.0, end: 1.0 });
      });
      break;
    case 1:
      segment(segment_ind, () => {
        rainbow();
        hueShiftStartToEnd({ start: 0.0, end: 3.0 });
      });
      break;
    case 2:
      segment(segment_rand, () => {
        rainbow();
        hueShiftStartToEnd({ start: 0.0, end: 1.0 });
      });
      break;
    case 3:
      segment(segment_centric, () => {
        rainbow();
        hueShiftStartToEnd({ start: 0.0, end: 3.0 });
      });
      break;
  }
}

const testSequence = async () => {
  const testAnimation = new Animation("buttons", 95, 316, 81);
  testAnimation.sync(() => {

    beats(0, 96, () => {
      for (let i = 0; i < 12; i++) {
        beats(i * 4, 96 - i * 4, () => {
          elements([i + 1], () => {
            const hue = i / 1984 * 2347;
            rainbow({ startHue: hue, endHue: hue + 0.1 });
            segment(segment_ind, () => {
              snakeFillGrow();
              // snake({ tailLength: 0.5, cyclic: true });
            });
            cycle(4, () => {
              cycleBeats(4, 0, 2, () => {
                pulse({
                  low: 0.4,
                  staticPhase: 0.25,
                });
              });
            });
          });
        });
        beats(i * 4, i * 4 + 1, () => {
          elements([i + 1], () => {
            fadeIn();
          });
        });
        beats(96 - i * 4 - 1, 96 - i * 4, () => {
          elements([i + 1], () => {
            fadeOut();
          });
        });
        if (i < 6) {
          beats(96 - i * 4, 96, () => {
            elements([i*2 + 1, i*2 + 2], () => {
              segment(segment_rand, () => {
                cycle(1, () => {
                  constColor({ hue: 0.5, sat: 1, val: 1 });
                  snake({ tailLength: 0.5, cyclic: true });
                });
              });
              beats(96 - i * 4, 96, () => {
                fadeIn();
              });
            });
          });
        }
      }
    });

    // 0-11 Episodes - fade in a ring each episode with constColor and then pulsate it with every ring adding
    // 12-23 Episodes - fade out a ring each episode, the ones that are on are pulsating
    // beats(0, 202, () => {
    //   elements(all, () => {
    //     rainbow({ startHue: 0.05, endHue: 0.1 });
    //     cycle(12, () => {
    //       snake({ tailLength: 0.125, cyclic: true });
    //     });
    //   });
    // });

    // episodes 16-24 - start fading in a ring each episode with confetti animation, but very low brightness from 16-20
    // episodes 24-32 - something more is added there, think what to do with it
    // episodes 32-40 - another sound starts to emerge and increase in the background, 32-36 very low, 36-40 very noticeable
    // episodes 40-48 - confetti drops, background sound takes over
    // episodes 48-50.5 - hold tension
    // beat 202 - shut everything off for drop
    beats(202, 204, () => {
      elements(all, () => {
        noColor();
      });
    });

    for (let e = 0; e < 32; e++) {
      beats(204.5 + e * 4, 204.5 + (e + 1) * 4, () => {
        cycle(1, () => {
          for (let i = 0; i < 12; i++) {
            elements([i + 1], () => {
              ringParty(e + i % 2);
              brightness({ value: 0.5 });
            });
          };
        });
      });
    }

    for (let e = 0; e < 8; e++) {
      beats(235, 235.5, () => {
        for (let i = 0; i < 12; i++) {
          elements([i + 1, 12 - i], () => {
            cycleBeats(0.5, i / 24, 0.5, () => {
              fadeOut();
            });
          });
        }
      });
    }

    // beat 204 - big entrance
    // elements(all, () => {
    //   // boom
    //   beats(204.3, 207, () => {
    //     segment(segment_arc, () => {
    //       rainbow();
    //       brightness({ value: 0.6 });
    //     });
    //   });
    //   // boom fade out and psychedelic
    //   beats(204, 207, () => {
    //     fadeOut();
    //     cycle(0.25, () => {
    //       hueShiftStartToEnd({ start: 0.0, end: 1.0 });
    //     });
    //   });
    // });
    // episodes 51-59 - play beat, every episode change colors a little
    // beat 235 (last beat of episode 58) - special sound
    // episodes 59-67 - play beat
    // episodes 67-75 - double beat and confetti sound
    // episodes 75-83 - beat is added on top of double beat
    // beat 331 (last beat of episode 82) - special sound
    // episodes 83-91 - all sounds playing, bass added
    // beat 363 (last beat of episode 90) - special sound
    // episodes 91-107 - all sounds playing, added melody
    // episodes 107-115 - start removing sounds, melody is still there
    // episodes 115-123 - melody is still there, bass is removed
    // episode 123 - fade out totally
    elements(all, () => {
      beats(492, 496, () => {
        fadeOut();
      });
    });

  });

  console.log("sending sequence");
  await sendSequence("buttons", testAnimation.getSequence());
  await startSong("buttons", 25);
};

(async () => {
  await testSequence();
})();
