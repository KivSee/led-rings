import { addEffect } from "./effect";

// multiple the brightness by a constant value to decrease it.
export const brightness = (opts: { value: number }) => {
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
        const_value: {
          value: opts.value,
        },
      },
    },
  });
};

// start with brightness 0.0, go up to 1.0
export const fadeIn = () => {
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
        linear: {
          start: 0.0,
          end: 1.0,
        },
      },
    },
  });
};

// start with brightness 1.0, go down to 0.0
export const fadeOut = () => {
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
        linear: {
          start: 1.0,
          end: 0.0,
        },
      },
    },
  });
};

// start with brightness 0.0, go up to "high" brightness, then go back down to 0.0
// the change is linear over the whole duration in a triangle shape
export const fadeInOut = (opts?: { high?: number }) => {
  const min = 0.0;
  const max = opts?.high ?? 1.0;
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
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

// start with brightness 1.0, go down to "low" brightness, then go back up to 1.0
// the change is linear over the whole duration in a triangle shape
export const fadeOutIn = (opts?: { low?: number }) => {
  const min = opts?.low ?? 0.0;
  const max = 1.0;
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
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

// blink is a simple half the time low brightness, half the time high brightness
// you can set the low brightness with the "low" option (default 0.5)
export const blink = (opts?: { low?: number }) => {
  const min = opts?.low ?? 0.5;
  const max = 1.0;
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
        half: {
          f1: {
            const_value: {
              value: min,
            },
          },
          f2: {
            const_value: {
              value: max,
            },
          },
        },
      },
    },
  });
};

// pulse is a sin wave on the brightness.
// the "low" option controls how low the brightness goes (default 0.5)
// this effect honors phase
export const pulse = (opts?: { low?: number, staticPhase?: number }) => {
  const min = opts?.low ?? 0.5;
  const max = 1.0;
  const staticPhase = opts?.staticPhase ?? 0;
  addEffect((phase: number) => {
    return {
      timed_brightness: {
        mult_factor_increase: {
          sin: {
            min: min,
            max: max,
            phase: phase + staticPhase,
            repeats: 1,
          },
        },
      },
    };
  });
};

// change the brightness linearly from "start" to "end"
export const fade = (opts: { start: number; end: number }) => {
  addEffect({
    timed_brightness: {
      mult_factor_increase: {
        linear: {
          start: opts.start,
          end: opts.end,
        },
      },
    },
  });
};

/** Brightness along snake (head to tail): one of mult_factor_increase or mult_factor_decrease by position in snake. */
export const snakeBrightness = (opts: {
  tailLength?: number;
  cyclic?: boolean;
  mult_factor_increase?: { start?: number; end?: number };
  mult_factor_decrease?: { start?: number; end?: number };
}) => {
  const tailLength = opts.tailLength ?? 0.5;
  const cyclic = opts.cyclic ?? false;
  const hasIncrease = opts.mult_factor_increase != null;
  const hasDecrease = opts.mult_factor_decrease != null;
  if (!hasIncrease && !hasDecrease) {
    addEffect({
      snake_brightness: {
        head: { linear: { start: 0, end: 1 } },
        tail_length: { const_value: { value: tailLength } },
        cyclic,
        mult_factor_decrease: {
          linear: { start: 1, end: 0 },
        },
      },
    });
    return;
  }
  addEffect({
    snake_brightness: {
      head: { linear: { start: 0, end: 1 } },
      tail_length: { const_value: { value: tailLength } },
      cyclic,
      ...(hasIncrease && {
        mult_factor_increase: {
          linear: {
            start: opts.mult_factor_increase!.start ?? 0,
            end: opts.mult_factor_increase!.end ?? 1,
          },
        },
      }),
      ...(hasDecrease && {
        mult_factor_decrease: {
          linear: {
            start: opts.mult_factor_decrease!.start ?? 1,
            end: opts.mult_factor_decrease!.end ?? 0,
          },
        },
      }),
    },
  });
};
