import { als } from "../async-local-storage";

export const elements = (e: number[], cb: Function) => {
  const store = als.getStore();
  const newStore = {
    elements: e,
    ...store,
    effectConfig: {
      ...store.effectConfig,
    },
  };
  als.run(newStore, cb);
};
