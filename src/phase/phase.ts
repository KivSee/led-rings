import { als } from "../async-local-storage";

export const phase = (intensity: number, cb : Function) => {
  const store = als.getStore();
  const newStore = {
    ...store,
    effectConfig: {
      ...store.effectConfig,
    },
    phase: intensity,
  };
  als.run(newStore, cb);
};
