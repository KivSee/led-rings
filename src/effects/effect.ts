import { als } from "../async-local-storage";
import { Effect } from "./types";
import { consumeTag } from "../recorder/effect-key-map";
import { recorder } from "../recorder/recorder";

let recordingMode = false;

export function setRecordingMode(enabled: boolean) {
  recordingMode = enabled;
}

export const addEffect = (specificEffectConfig: any | Function) => {
  const store = als.getStore();
  const { animation } = store;

  if (recordingMode) {
    const tag = consumeTag();
    if (tag) {
      recorder.recordEffect(tag.effectKey, tag.params);
    } else if (typeof specificEffectConfig !== "function") {
      const keys = Object.keys(specificEffectConfig);
      const effectKey = keys.length === 1 ? keys[0] : keys.join("+");
      const params = keys.length === 1 ? specificEffectConfig[keys[0]] : specificEffectConfig;
      recorder.recordEffect(effectKey, params);
    }
  }

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
