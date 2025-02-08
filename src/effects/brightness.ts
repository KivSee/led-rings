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
