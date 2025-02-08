import { als } from "../async-local-storage";
import { Effect } from "./types";

export const constColor = (hue: number, sat: number, val: number) => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const constColorEffect: Effect = {
      effect_config: store.effectConfig,
      const_color: {
        color: {
          hue: hue + phase,
          sat: sat,
          val: val,
        },
      },
    };
    return constColorEffect;
  });
};

export const rainbow = () => {
  const store = als.getStore();

  store.animation.addEffect((phase: number) => {
    const rainbowEffect: Effect = {
      effect_config: store.effectConfig,
      rainbow: {
        hue_start: {
          const_value: {
            value: 0.0 + phase,
          },
        },
        hue_end: {
          const_value: {
            value: 1.0 + phase,
          },
        },
      },
    };
    return rainbowEffect;
  });
};
