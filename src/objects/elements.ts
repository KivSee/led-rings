import { als } from "../async-local-storage";

export const segment = (name: string, cb: Function) => {
    const store = als.getStore();
    const newStore = {
        ...store,
        effectConfig: {
        ...store.effectConfig,
        segments: name,
        },
    };
    als.run(newStore, cb);
    }

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
