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

export const hueShiftStartToEnd = ({ start, end }: {
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
