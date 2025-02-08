import { addEffect } from "./effect";

export const snake = () => {
  addEffect({
    snake: {
      head: {
        linear: {
          start: 0.0,
          end: 1.0,
        },
      },
      tailLength: {
        constValue: {
          value: 1.5,
        },
      },
      cyclic: true,
    },
  });
};

export const snakeInOut = (opt?: { start: number; end: number }) => {
  addEffect({
    snake: {
      head: {
        sin: {
          min: 0,
          max: 1.5,
          phase: 0.0,
          repeats: 1.0,
        },
      },
      tailLength: {
        constValue: {
          value: 0.5,
        },
      },
    },
  });
};
