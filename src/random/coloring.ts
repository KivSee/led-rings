import { dotted, pastel, rainbow, vivid } from "../effects/coloring";
import { elements, segment } from "../objects/elements";
import { all, segment_arc, segment_centric, segment_ind, segment_updown } from "../objects/ring-elements";
import { phase } from "../phase/phase";

const goodPhases = [0.0, 0.25, 0.5, 1.0, 2, 3, 4, 6, 8.8];
const getRandomPhase = () => {
  const randomIndex = Math.floor(Math.random() * goodPhases.length);
  return goodPhases[randomIndex];
};

const randVividColor = () => {
  elements(all, () => {
    phase(getRandomPhase(), () => {
      vivid({ hue: Math.random() });
    });
  });
};

const randPastelColor = () => {
  elements(all, () => {
    phase(getRandomPhase(), () => {
      pastel({ hue: Math.random() });
    });
  });
};

const randRainbow = () => {

  const startHue = Math.random();
  const rounds = [0.25, 0.5, 1.0, 2.0, 4.0];

  const randRoundIndex = Math.floor(Math.random() * rounds.length);
  const round = rounds[randRoundIndex];

  const possibleSegments = [segment_centric, segment_arc, segment_arc, segment_ind];
  const randSegmentIndex = Math.floor(Math.random() * possibleSegments.length);
  const selectedSegment = possibleSegments[randSegmentIndex];

  elements(all, () => {
    phase(getRandomPhase(), () => {
      segment(selectedSegment, () => {
        rainbow({
          startHue,
          endHue: startHue + round,
        });
      });
    });
  });
};

const randDotted = () => {
  elements(all, () => {
    phase(getRandomPhase(), () => {
      dotted({
        hue: Math.random(),
        hueDiff: Math.random() * 0.5 + 0.1,
        contrast: Math.random() * 0.5 + 0.1,
      });
    });
  });
};

export const addRandomColoring = () => {
  const options = [randRainbow, randVividColor, randPastelColor, randDotted];
  const randomIndex = Math.floor(Math.random() * options.length);
  const optionFunc = options[randomIndex];
  optionFunc();
};
