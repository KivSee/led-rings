import { hueShiftSin, hueShiftStartToEnd } from "../effects/hue";
import { elements } from "../objects/elements";
import { all } from "../objects/ring-elements";
import { cycle } from "../time/time";

const noDynamicHue = () => {};

const linearDynamicHue = () => {
  const goodSpeed = [2.0, 4.0, 8.0];
  const speed = goodSpeed[Math.floor(Math.random() * goodSpeed.length)];

  elements(all, () => {
    cycle(speed, () => {
      hueShiftStartToEnd({ start: 0.0, end: 1.0 });
    });
  });
};

const sinDynamicHue = () => {
    const goodSpeed = [1.0, 2.0, 4.0];
    const speed = goodSpeed[Math.floor(Math.random() * goodSpeed.length)];

    elements(all, () => {
        cycle(speed, () => {
            hueShiftSin({ amount: 1.0 });
        });
    });
};

export const addRandomDynamicHue = () => {
    const options = [noDynamicHue, linearDynamicHue, sinDynamicHue];
  const randomIndex = Math.floor(Math.random() * options.length);
  const optionFunc = options[randomIndex];
  optionFunc();
};
