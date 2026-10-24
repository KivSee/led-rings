import { als } from "../async-local-storage";

/** Distribute effects added inside cb across rings with per-ring offsets of
 *  index/N * intensity. Negative intensity reverses direction (offsets run
 *  last→first ring), giving mirror symmetry between left/right ring pairs. */
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
