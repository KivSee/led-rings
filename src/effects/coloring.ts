import { als } from "../async-local-storage";
import { Effect } from "./types";

export const constColor = (hue: number, sat: number, val: number) => {
    const store = als.getStore();
    
    const constColorEffect: Effect = {
        effect_config: store.effectConfig,
        const_color: {
            color: {
                hue: hue,
                sat: sat,
                val: val
            }
        }
    };

    const { animation } = store;
    animation.addEffect(constColorEffect);
}