import { cycle } from "../time/time";
import { addEffect } from "./effect";

export const staticHueShift = (opts: { value: number }) => {
  addEffect({
    hue: {
      offset_factor: {
        const_value: {
          value: opts.value,
        },
      },
    },
  });
};

export const hueShiftStartToEnd = ({
  start,
  end,
}: {
  start: number;
  end: number;
}) => {
  addEffect({
    hue: {
      offset_factor: {
        linear: {
          start,
          end,
        },
      },
    },
  });
};

export const hueShiftSin = ({ amount }: { amount: number }) => {
  addEffect((phase: number) => ({
    hue: {
      offset_factor: {
        sin: {
          min: 0,
          max: amount,
          phase,
          repeats: 1,
        },
      },
    },
  }));
};

/** Hue offset along snake (head to tail). */
export const snakeHue = (opts: {
  tailLength?: number;
  cyclic?: boolean;
  offset?: number;
}) => {
  const tailLength = opts.tailLength ?? 0.5;
  const cyclic = opts.cyclic ?? false;
  const offset = opts.offset ?? 0.5;
  addEffect({
    snake_hue: {
      head: { linear: { start: 0, end: 1 } },
      tail_length: { const_value: { value: tailLength } },
      cyclic,
      offset_factor: {
        linear: { start: 0, end: offset },
      },
    },
  });
};
