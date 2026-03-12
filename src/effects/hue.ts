import { addEffect } from "./effect";
import { tagEffect } from "../recorder/effect-key-map";

export const staticHueShift = (opts: { value: number }) => {
  tagEffect("staticHueShift", opts);
  addEffect({
    timed_hue: {
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
  tagEffect("hueShiftStartToEnd", { start, end });
  addEffect({
    timed_hue: {
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
  tagEffect("hueShiftSin", { amount });
  addEffect((phase: number) => ({
    timed_hue: {
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
  tagEffect("snakeHue", opts);
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
