import { addEffect } from "./effect";

// multiple the brightness by a constant value to decrease it.
export const brightness = (opts: { value: number }) => {
  addEffect({
    brightness: {
      mult_factor: {
        const_value: {
          value: opts.value,
        },
      },
    },
  });
};

// start with brightness 0.0, go up to 1.0
// this effect does NOT honor phase and does not have configuration.
export const fadeIn = () => {
  addEffect({
    brightness: {
      mult_factor: {
        linear: {
          start: 0.0,
          end: 1.0,
        },
      },
    },
  });
};

// start with brightness 1.0, go down to 0.0
// this effect does NOT honor phase and does not have configuration.
export const fadeOut = () => {
  addEffect({
    brightness: {
      mult_factor: {
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
// this effect does NOT honor phase
export const fadeInOut = (opts?: { high?: number }) => {
  const min = 0.0;
  const max = opts?.high ?? 1.0;
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

// start with brightness 1.0, go down to "low" brightness, then go back up to 1.0
// the change is linear over the whole duration in a triangle shape
// this effect does NOT honor phase
export const fadeOutIn = (opts?: { low?: number }) => {
  const min = opts?.low ?? 0.0;
  const max = 1.0;
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

// blink is a simple half the time low brightness, half the time high brightness
// you can set the low brightness with the "low" option (default 0.5)
// phase is NOT honored in this effect.
export const blink = (opts?: { low?: number }) => {
  const min = opts?.low ?? 0.5;
  const max = 1.0;
  addEffect({
    brightness: {
      mult_factor: {
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
export const pulse = (opts?: { low?: number }) => {
  const min = opts?.low ?? 0.5;
  const max = 1.0;
  addEffect((phase: number) => {
    return {
      brightness: {
        mult_factor: {
          sin: {
            min: min,
            max: max,
            phase,
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
    brightness: {
      mult_factor: {
        linear: {
          start: opts.start,
          end: opts.end,
        },
      },
    },
  });
}
