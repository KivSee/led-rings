import { als } from "../async-local-storage";
import { Effect } from "./types";

export const constColor = (hue: number, sat: number, val: number) => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const constColorEffect: Effect = {
      effect_config: store.effectConfig,
      const_color: {
        color: {
          hue: hue,
          sat: sat,
          val: val,
        },
      },
    };
    return constColorEffect;
  });
};

export const rainbow = ({ startHue = 0.0, endHue = 1.0}: {
    startHue: number,
    endHue: number,
}) => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const rainbowEffect: Effect = {
      effect_config: store.effectConfig,
      rainbow: {
        hue_start: {
          const_value: {
            value: startHue + phase,
          },
        },
        hue_end: {
          const_value: {
            value: endHue + phase,
          },
        },
      },
    };
    return rainbowEffect;
  });
};
