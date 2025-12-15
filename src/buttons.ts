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
  snakeHeadSin,
  snakeInOut,
  staticSnake,
} from "./effects/motion";
import { phase } from "./phase/phase";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "./effects/hue";
import { addEffect } from "./effects/effect";

function getRandomSubset(numberRingsOn: number): number[] {
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, ..., 12]
  const indicesToRemove = new Set<number>();
  while (indicesToRemove.size < numberRingsOn) {
    indicesToRemove.add(Math.floor(Math.random() * 12));
  }
  return numbers.filter((_, index) => !indicesToRemove.has(index));
}

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
          beats(96 - i * 4, 100, () => {
            elements([i * 2 + 1, i * 2 + 2], () => {
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

    beats(100, 160, () => {
      elements(all, () => {
        cycle(2, () => {
          segment(segment_rand, () => {
            constColor({ hue: 0.5, sat: 1, val: 0.7 });
            snake({ tailLength: 0.5, cyclic: true });
          });
        });
        cycle(8, () => {
          elements(even, () => {
            segment(segment_b2, () => {
              addEffect({
                hue: {
                  offset_factor: {
                    sin: {
                      min: 0,
                      max: 0.25,
                      phase: -0.25,
                      repeats: 1,
                    },
                  },
                },
              });
            });
          });
        });
      });
      cycle(1, () => {
        cycleBeats(1, 0, 0.1, () => {
          elements([1, 9], () => {
            segment(segment_b1, () => {
              constColor({ hue: 0.67, sat: 1.0, val: 0.8 });
            });
          });
        });
        cycleBeats(1, 0.2, 0.3, () => {
          elements([12, 8], () => {
            segment(segment_b1, () => {
              constColor({ hue: 0.67, sat: 1.0, val: 0.8 });
            });
          });
        });
        cycleBeats(1, 0.4, 0.5, () => {
          elements([3, 5], () => {
            segment(segment_b1, () => {
              constColor({ hue: 0.67, sat: 1.0, val: 0.8 });
            });
          });
        });
        cycleBeats(1, 0.6, 0.7, () => {
          elements([4, 11], () => {
            segment(segment_b1, () => {
              constColor({ hue: 0.67, sat: 1.0, val: 0.8 });
            });
          });
        });
        cycleBeats(1, 0.8, 0.9, () => {
          elements([1, 6], () => {
            segment(segment_b1, () => {
              constColor({ hue: 0.67, sat: 1.0, val: 0.8 });
            });
          });
        });
      });
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

    beats(160, 192, () => {
      for (let i = 0; i < 8; i++) {
        beats(160 + i * 4, 192, () => {
          const startIndex = Math.floor(i / 2) * 3 + (i % 2 === 0 ? 1 : 2);
          const elementIndices = i % 2 === 0
            ? [startIndex]
            : [startIndex, startIndex + 1];
          elements(elementIndices, () => {
            constColor({ hue: 0.78, sat: 1.0, val: 1.0 });
            segment(segment_arc, () => {
              snakeFillGrow();
            });
          });
        });
      }
    });

    beats(192, 196, () => {
      elements(all, () => {
        constColor({ hue: 0.78, sat: 1.0, val: 1.0 });
        fade({ start: 1.0, end: 0.3 });
      });
    });
    beats(196, 202, () => {
      elements(all, () => {
        constColor({ hue: 0.78, sat: 1.0, val: 1.0 });
        fade({ start: 0.3, end: 1.0 });
        cycle(0.25, () => {
          pulse({ low: 0.8 });
        });
      });
    });

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

    beats(236, 268, () => {
      elements(all, () => {
        cycleBeats(2, 1.5, 1.65, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.2, sat: 0.7, val: 0.8 });
          });
        });
      });
    });

    beats(268, 331, () => {
      elements(all, () => {
        cycle(4, () => {
          segment(segment_rand, () => {
            snakeHeadSin({ tailLength: 1.0, cyclic: true });
          });
        });
      });
    });

    beats(300, 331, () => {
      elements(all, () => {
        cycleBeats(2, 1.5, 1.75, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.5, sat: 0.8, val: 0.5 });
          });
        });
      });
    });

    beats(331, 332, () => {
      for (let e = 0; e < 8; e++) {
        for (let i = 0; i < 12; i++) {
          elements([i + 1, 12 - i], () => {
            cycleBeats(1, i / 24, 1, () => {
              fadeOut();
            });
          });
        }
      };
    });

    beats(332, 364, () => {
      elements(even, () => {
        cycle(2, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.33, sat: 0.8, val: 0.6 });
            fadeInOut({ high: 1.0 });
          });
        });
      });
      elements(odd, () => {
        cycle(0.1, () => {
          segment(segment_b2, () => {
            constColor({ hue: 0.25, sat: 0.8, val: 0.2 });
            blink({ low: 0.8 });
          });
        });
        cycleBeats(4, 0.5, 1.5, () => {
          segment(segment_b1, () => {
            constColor({ hue: 0.35, sat: 0.7, val: 0.8 });
            fadeOut();
          });
        });
      });
    });

    beats(364, 396, () => {
      elements(all, () => {
        constColor({ hue: 0.0, sat: 0.95, val: 0.8 });
        cycleBeats(4, 0, 1.5, () => {
          segment(segment_arc, () => {
            snake({ tailLength: 0.5, cyclic: true });
          });
        });
        cycleBeats(4, 1.5, 2, () => {
          segment(segment_arc, () => {
            staticSnake({ start: 0.5, end: 1.0 });
          });
        });
        cycleBeats(4, 2, 3.5, () => {
          segment(segment_arc, () => {
            snake({ tailLength: 0.5, cyclic: true, reverse: true });
          });
        });
        cycleBeats(4, 3.5, 4, () => {
          segment(segment_arc, () => {
            staticSnake({ start: 0.25, end: 0.75 });
          });
        });
      });
    });

    beats(380, 396, () => {
      elements(all, () => {
        hueShiftStartToEnd({ start: 0.0, end: 3.0 });
      });
    });

    beats(396, 500, () => {
      elements(odd, () => {
        segment(segment_updown, () => {
          rainbow({ startHue: 0.3, endHue: 0.8 });
        });
      });
      elements(even, () => {
        segment(segment_updown, () => {
          rainbow({ startHue: 0.5, endHue: 0.8 });
        });
      });
    });

    beats(396, 428, () => {
      cycle(2, () => {
        segment(segment_centric, () => {
          elements(even, () => {
            snakeFillGrow();
          });
          elements(odd, () => {
            snakeFillGrow(true);
          });
        });
      });
    });

    beats(428, 500, () => {
      elements(all, () => {
        segment(segment_rand, () => {
          cycle(2, () => {
            snake({ tailLength: 0.5, cyclic: true });
          });
        });
      });
    });

    beats(428.5, 460.5, () => {
      elements(all, () => {
        cycle(4, () => {
          hueShiftStartToEnd({ start: 0.0, end: 0.35 });
        });
      });
    });

    elements([12, 1], () => {
      beats(460, 464, () => {
        fadeOut();
      });
      beats(464, 484, () => {
        noColor();
      });
    });
    elements([11, 2], () => {
      beats(464, 468, () => {
        fadeOut();
      }); 
      beats(468, 484, () => {
        noColor();
      });
    });
    elements([10, 3], () => {
      beats(468, 472, () => {
        fadeOut();
      });
      beats(472, 484, () => {
        noColor();
      });
    });
    elements([9, 4], () => {
      beats(472, 476, () => {
        fadeOut();
      });
      beats(476, 484, () => {
        noColor();
      });
    });
    elements([8, 5], () => {
      beats(476, 480, () => {
        fadeOut();
      });
      beats(480, 484, () => {
        noColor();
      });
    });
    elements([7, 6], () => {
      beats(480, 484, () => {
        fadeOut();
      });
    });
    elements(all, () => {
      beats(484, 500, () => {
        fadeInOut({ high: 0.5 });
      });
    });

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
      beats(492, 500, () => {
        fadeOut();
      });
    });

  });

  console.log("sending sequence");
  await sendSequence("buttons", testAnimation.getSequence());
  await startSong("buttons", 250);
};

(async () => {
  await testSequence();
})();
