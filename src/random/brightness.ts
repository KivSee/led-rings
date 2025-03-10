import { brightness, pulse } from "../effects/brightness";
import { elements, segment } from "../objects/elements";
import { all, segment_b1, segment_b2 } from "../objects/ring-elements";
import { phase } from "../phase/phase";
import { cycle, cycleBeats } from "../time/time";

const noRandBrightness = () => {};

const randomPulse = () => {
  const goodPhases = [1.0, 2.0, 3.0, 6.0, 19.6];
  const getRandomPhase = () => {
    const randomIndex = Math.floor(Math.random() * goodPhases.length);
    return goodPhases[randomIndex];
  };

  elements(all, () => {
    phase(getRandomPhase(), () =>
      cycle(1.0, () =>
        pulse({
          low: Math.random() * 0.5 + 0.2,
        })
      )
    );
  });
};

const randomAlternate = () => {
  const goodPhases = [1.0, 2.0, 3.0, 6.0, 19.6];
  const getRandomPhase = () => {
    const randomIndex = Math.floor(Math.random() * goodPhases.length);
    return goodPhases[randomIndex];
  };
  elements(all, () => {
    cycle(0.5, () => {
      phase(getRandomPhase(), () => {
        segment(segment_b1, () => {
          pulse({ low: 0.0 });
        });
        segment(segment_b2, () => {
          pulse({ low: 0.0, staticPhase: 0.5 });
        });
      });
    });
  });
};

export const addRandomBrightness = () => {
  //   const options = [noRandBrightness, randomPulse];
  const options = [randomAlternate];
  const randomIndex = Math.floor(Math.random() * options.length);
  const optionFunc = options[randomIndex];
  optionFunc();
};
