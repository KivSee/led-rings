// /Users/sapir/repos/led-rings/src/animation/animation.ts
import { als } from "../async-local-storage";
import { Effect, EffectConfig, Sequence } from "../effects/types";
import { SequencePerThing } from "../services/sequence";

interface EffectWithElements {
    effect: Effect;
    elements: number[];
}

export class Animation {

    private effects: EffectWithElements[] = [];

    constructor(
        public name: string,
        public bpm: number,
        public totalTimeSeconds: number,
        public startOffsetSeconds: number = 0
    ) { }

    public sync(cb: Function) {
        const emptyEffectConfig: Partial<EffectConfig> = {
            segments: "all",
        };
        als.run({animation: this, effectConfig: emptyEffectConfig}, cb);
    }

    public addEffect(effect: Effect | Function) {
        const store = als.getStore();
        if (typeof effect === "function") {
            for (let i = 0; i < store.elements.length; i++) {
                const phase = i / store.elements.length * store.phase;
                const e = effect(phase);
                this.effects.push({
                    effect: e,
                    elements: [store.elements[i]],
                });
            }
            return;
        }
        this.effects.push({
            effect,
            elements: store.elements,
        });
    }

    public getSequence(): SequencePerThing {
        const seqPerThing: SequencePerThing = {};
        this.effects.forEach(effectWithElements => {
            effectWithElements.elements.forEach((element: number) => {
                const thingName = `ring${element}`;
                if(!seqPerThing[thingName]) {
                    seqPerThing[thingName] = {
                        effects: [],
                        duration_ms: this.totalTimeSeconds * 1000,
                        num_repeats: 0,
                    };
                }
                seqPerThing[thingName].effects.push(effectWithElements.effect);
            });
        });
        return seqPerThing;
    }

}

// /Users/sapir/repos/led-rings/src/effects/coloring.ts
import { als } from "../async-local-storage";
import { Effect } from "./types";

export const constColor = (hue: number, sat: number, val: number) => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const constColorEffect: Effect = {
      effect_config: store.effectConfig,
      const_color: {
        color: {
          hue: hue + phase,
          sat: sat,
          val: val,
        },
      },
    };
    return constColorEffect;
  });
};

export const rainbow = () => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const rainbowEffect: Effect = {
      effect_config: store.effectConfig,
      rainbow: {
        hue_start: {
          const_value: {
            value: 0.0 + phase,
          },
        },
        hue_end: {
          const_value: {
            value: 1.0 + phase,
          },
        },
      },
    };
    return rainbowEffect;
  });
};

// /Users/sapir/repos/led-rings/src/effects/brightness.ts
import { addEffect } from "./effect";

export const fadeIn = (opt?: { start: number; end: number }) => {
  addEffect({
    brightness: {
      mult_factor: {
        linear: {
          start: opt?.start ?? 0.0,
          end: opt?.end ?? 1.0,
        },
      },
    },
  });
};

export const fadeOut = (opts?: { start: number; end: number }) => {
  addEffect({
    brightness: {
      mult_factor: {
        linear: {
          start: opts?.start ?? 1.0,
          end: opts?.end ?? 0.0,
        },
      },
    },
  });
};

export const fadeInOut = (opts?: { min: number; max: number }) => {
  const min = opts?.min ?? 0.0;
  const max = opts?.max ?? 1.0;
  addEffect({
    brightness: {
      mult_factor: {
        half: {
          f1: {
            linear: {
              start: min,
              end: max,
            },
          },
          f2: {
            linear: {
              start: max,
              end: min,
            },
          },
        },
      },
    },
  });
};

export const fadeOutIn = (opts?: { min?: number; max?: number }) => {
  const min = opts?.min ?? 0.0;
  const max = opts?.max ?? 1.0;
  addEffect({
    brightness: {
      mult_factor: {
        half: {
          f1: {
            linear: {
              start: max,
              end: min,
            },
          },
          f2: {
            linear: {
              start: min,
              end: max,
            },
          },
        },
      },
    },
  });
};

export const blink = (opts?: { low: number; high: number }) => {
  addEffect({
    brightness: {
      mult_factor: {
        half: {
          f1: {
            const_value: {
              value: opts?.low ?? 0.0,
            },
          },
          f2: {
            const_value: {
              value: opts?.high ?? 1.0,
            },
          },
        },
      },
    },
  });
};

// /Users/sapir/repos/led-rings/src/effects/motion.ts
import { phase } from "../phase/phase";
import { addEffect } from "./effect";

export const snake = () => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          linear: {
            start: phase,
            end: phase + 1,
          },
        },
        tailLength: {
          constValue: {
            value: 1.5,
          },
        },
        cyclic: true,
      },
    };
  });
};

export const snakeInOut = (opt?: { start: number; end: number }) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          sin: {
            min: 0,
            max: 1.5,
            phase: phase,
            repeats: 1.0,
          },
        },
        tailLength: {
          constValue: {
            value: 1.5,
          },
        },
      },
    };
  });
};

// /Users/sapir/repos/led-rings/src/effects/types.ts
import { SegmentName } from "../objects/types";
import { FloatFunction } from "./functions";

export type EffectConfig = {
    start_time: number;
    end_time: number;
    segments: SegmentName;

    repeat_num?: number;
    repeat_start?: number;
    repeat_end?: number;
}

export type ConstColor = {
    color: {
        hue: number;
        sat: number;
        val: number;
    }
}

export type Rainbow = {
    hue_start: FloatFunction;
    hue_end: FloatFunction;
};

export type Brightness = {
    mult_factor: FloatFunction;
};

export type Hue = {
    offset_factor: FloatFunction;
};

export type Saturation = {
    mult_factor: FloatFunction;
};

export type Snake = {
    head: FloatFunction;
    tail_length: FloatFunction;
    cyclic: boolean;
};

export type Segment = {
    start: FloatFunction;
    end: FloatFunction;
};

export type Glitter = {
    intensity: FloatFunction;
    sat_mult_factor: FloatFunction;
};

export type Alternate = {
    numberOfPixels: number;
    hue_offset: FloatFunction;
    sat_mult: FloatFunction;
    brightness_mult: FloatFunction;
};

export type Effect = {
    effect_config: EffectConfig;
    const_color?: ConstColor;
    rainbow?: Rainbow;
    brightness?: Brightness;
    hue?: Hue;
    saturation?: Saturation;
    snake?: Snake;
    segment?: Segment;
    glitter?: Glitter;
    alternate?: Alternate;
};

export type Sequence = {
    effects: Effect[];
    duration_ms: number;
    num_repeats: number;
}
// /Users/sapir/repos/led-rings/src/time/time.ts
import { als } from "../async-local-storage";

const beatToMs = (beat: number, bpm: number) => {
    return beat * 60 / bpm * 1000;
}

export const beats = (startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm } = store.animation;
    const startTime = Math.round(beatToMs(startBeat, bpm));
    const endTime = Math.round(beatToMs(endBeat, bpm));
    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            start_time: startTime,
            end_time: endTime,
        }
    }
    als.run(newStore, cb);
}

export const cycleBeats = (beatsInCycle: number, startBeat: number, endBeat: number, cb: Function) => {
    const store = als.getStore();
    const { bpm } = store.animation;
    const totalBeats = (store.effectConfig.end_time - store.effectConfig.start_time) / 1000 / 60 * bpm;
    const repeatNum = totalBeats / beatsInCycle;
    
    const newStore = {
        ...store,
        effectConfig: {
            ...store.effectConfig,
            repeat_num: repeatNum,
            repeat_start: startBeat / beatsInCycle,
            repeat_end: endBeat / beatsInCycle,
        }
    }
    als.run(newStore, cb);
}
// /Users/sapir/repos/led-rings/src/objects/ring-elements.ts
export const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const odd = [1, 3, 5, 7, 9, 11];
export const even = [2, 4, 6, 8, 10, 12];
export const left = [1, 2, 3, 4, 5, 6];
export const right = [7, 8, 9, 10, 11, 12];
export const center = [4, 5, 6, 7, 8, 9];
export const outer = [1, 2, 3, 10, 11, 12];

export const segment_all = "all";
export const segment_centric = "centric";
export const segment_updown = "updown";
export const segment_arc = "arc";
export const segment_ind = "ind";
export const segment_b1 = "b1";
export const segment_b2 = "b2";

