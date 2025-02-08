import { als } from "../async-local-storage";
import { Effect } from "./types";

export const addEffect = (specificEffectConfig: any) => {
    const store = als.getStore();
    const { animation } = store;
    const effect = {
      effect_config: store.effectConfig,
      ...specificEffectConfig,
    };
    animation.addEffect(effect);
  };
  