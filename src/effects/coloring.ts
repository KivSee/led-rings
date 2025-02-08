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
