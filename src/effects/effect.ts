import { als } from "../async-local-storage";
import { Effect } from "./types";

export const addEffect = (specificEffectConfig: any | Function) => {
  const store = als.getStore();
  const { animation } = store;
  if (typeof specificEffectConfig === "function") {
    animation.addEffect((phase: number) => {
      const effect = specificEffectConfig(phase);
      return {
        effect_config: store.effectConfig,
        ...effect,
      };
    });
  } else {
    const effect = {
      effect_config: store.effectConfig,
      ...specificEffectConfig,
    };
    animation.addEffect(effect);
    return effect;
  }
};
