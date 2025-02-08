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
