import { Effect } from "./effects/types";
import { sendSequence, SequencePerThing } from "./services/sequence";
import { startSong, trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { NUMBER_OF_RINGS } from "./sys-config/sys-config";
import { beats, cycle, cycleBeats } from "./time/time";
import { constColor, noColor, rainbow, vivid } from "./effects/coloring";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "./effects/brightness";
import { elements, segment } from "./objects/elements";
import {
  all,
  center,
  even,
  left,
  odd,
  right,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_updown,
} from "./objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeInOut,
  staticSnake,
} from "./effects/motion";
import { phase } from "./phase/phase";
import { hueShiftStartToEnd, staticHueShift } from "./effects/hue";

const trunOnIRings = (numberRingsOn: number) => {
  elements([numberRingsOn], () => {
    for (let i = 0; i < numberRingsOn; i++) {
      segment(i.toString(), () => {
        vivid({ hue: i / NUMBER_OF_RINGS });
      });
    }
  });
};

const indexTrigger = async () => {
  const testAnimation = new Animation("index", 60, 10);
  testAnimation.sync(() => {
    beats(0, 10, () => {
      for (let i = 1; i <= NUMBER_OF_RINGS; i++) {
        trunOnIRings(i);
      }
    });
  });

  console.log("sending sequence");
  await sendSequence("index", testAnimation.getSequence());
  await trigger("index");
};

(async () => {
  await indexTrigger();
})();
