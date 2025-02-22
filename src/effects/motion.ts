import { phase } from "../phase/phase";
import { addEffect } from "./effect";

export const snake = (
  {
    tailLength,
  }: {
    tailLength: number;
  } = { tailLength: 0.5 }
) => {
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
            value: tailLength,
          },
        },
        cyclic: false,
      },
    };
  });
};

export const snakeFillGrow = () => {
  addEffect({
    snake: {
      head: {
        half: {
          f1: {
            linear: {
              start: 0,
              end: 1.0,
            },
          },
          f2: {
            const_value: {
              value: 1.0,
            },
          },
        },
      },
      tailLength: {
        half: {
          f1: {
            const_value: {
              value: 0.5,
            },
          },
          f2: {
            linear: {
              start: 0.5,
              end: 3.0,
            },
          },
        },
      },
      cyclic: false,
    },
  });
};

export const snakeInOut = (opt?: { start: number; end: number }) => {
  addEffect((phase: number) => {
    return {
      snake: {
        head: {
          sin: {
            min: 0,
            max: 1.0,
            phase: 0.75,
            repeats: 1.0,
          },
        },
        tailLength: {
          constValue: {
            value: 0.5,
          },
        },
      },
    };
  });
};
