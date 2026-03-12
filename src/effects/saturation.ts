import { addEffect } from "./effect";
import { tagEffect } from "../recorder/effect-key-map";

/** Saturation along snake (head to tail): one of mult_factor_increase or mult_factor_decrease by position in snake. */
export const snakeSaturation = (opts: {
  tailLength?: number;
  cyclic?: boolean;
  mult_factor_increase?: { start?: number; end?: number };
  mult_factor_decrease?: { start?: number; end?: number };
}) => {
  tagEffect("snakeSaturation", opts);
  const tailLength = opts.tailLength ?? 0.5;
  const cyclic = opts.cyclic ?? false;
  const hasIncrease = opts.mult_factor_increase != null;
  const hasDecrease = opts.mult_factor_decrease != null;
  if (!hasIncrease && !hasDecrease) {
    addEffect({
      snake_saturation: {
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
    snake_saturation: {
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
