import { snake, snakeHeadSin, snakeSlowFast } from "../effects/motion";
import { elements, segment } from "../objects/elements";
import {
  all,
  segment_arc,
  segment_centric,
  segment_ind,
  segment_updown,
} from "../objects/ring-elements";
import { phase } from "../phase/phase";
import { cycle } from "../time/time";

const noMotion = () => {};

const cyclicSnake = () => {
  const goodTailLengths = [0.1, 0.3, 0.5, 1.0, 2.0];
  const randomIndex = Math.floor(Math.random() * goodTailLengths.length);
  const tailLength = goodTailLengths[randomIndex];

  const goodPhases = [0.0, 0.25, 0.5, 1.0, 2, 3, 4, 6, 8.8];
  const phaseAmount = goodPhases[Math.floor(Math.random() * goodPhases.length)];

  const possibleSegments = [
    segment_centric,
    segment_arc,
    segment_arc,
    segment_ind,
    segment_updown,
  ];
  const randSegmentIndex = Math.floor(Math.random() * possibleSegments.length);
  const selectedSegment = possibleSegments[randSegmentIndex];

  const goodSpeed = [0.5, 1.0, 2.0, 4.0, 8.0];
  const speed = goodSpeed[Math.floor(Math.random() * goodSpeed.length)];

  elements(all, () => {
    phase(phaseAmount, () => {
      segment(selectedSegment, () => {
        cycle(speed, () => {
          snake({ tailLength, cyclic: true });
        });
      });
    });
  });
};

export const randomSinSnakeHead = () => {
  const goodTailLengths = [0.1, 0.3, 0.5, 1.0, 2.0];
  const randomIndex = Math.floor(Math.random() * goodTailLengths.length);
  const tailLength = goodTailLengths[randomIndex];

  const goodPhases = [0.0, 0.25, 0.5, 1.0, 2, 3, 4, 6, 8.8];
  const phaseAmount = goodPhases[Math.floor(Math.random() * goodPhases.length)];

  const possibleSegments = [
    segment_centric,
    segment_arc,
    segment_arc,
    segment_ind,
    segment_updown,
  ];
  const randSegmentIndex = Math.floor(Math.random() * possibleSegments.length);
  const selectedSegment = possibleSegments[randSegmentIndex];

  const goodSpeed = [0.5, 1.0, 2.0, 4.0, 8.0];
  const speed = goodSpeed[Math.floor(Math.random() * goodSpeed.length)];

  elements(all, () => {
    phase(phaseAmount, () => {
      segment(selectedSegment, () => {
        cycle(speed, () => {
          snakeHeadSin({ tailLength });
        });
      });
    });
  });
};

export const randomSnakeSlowFast = () => {
  const goodSpeed = [1.0, 2.0];
  const speed = goodSpeed[Math.floor(Math.random() * goodSpeed.length)];

  const goodPhases = [0.0, 0.5];
  const phaseAmount = goodPhases[Math.floor(Math.random() * goodPhases.length)];

  const goodSegments = [segment_centric, segment_ind];
  const randSegmentIndex = Math.floor(Math.random() * goodSegments.length);
  const selectedSegment = goodSegments[randSegmentIndex];

  elements(all, () => {
    cycle(speed, () => {
      phase(phaseAmount, () => {
        segment(selectedSegment, () => {
          snakeSlowFast({ tailLength: 1.0});
        });
      });
    });
  });
};

export const addRandomMotion = () => {
  const options = [noMotion, cyclicSnake, cyclicSnake, randomSinSnakeHead, randomSinSnakeHead, randomSnakeSlowFast];
  const randomIndex = Math.floor(Math.random() * options.length);
  const optionFunc = options[randomIndex];
  optionFunc();
};
