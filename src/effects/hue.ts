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
