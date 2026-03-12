import { Effect } from "../effects/types";
import { sendSequence, SequencePerThing } from "../services/sequence";
import { startSong, trigger } from "../services/trigger";
import { Animation } from "../animation/animation";
import { NUMBER_OF_RINGS } from "../sys-config/sys-config";
import { beats, cycle, cycleBeats } from "../time/time";
import { constColor, noColor, rainbow, vivid } from "../effects/coloring";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "../effects/brightness";
import { elements, segment } from "../objects/elements";
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
  segment_rand,
  segment_updown,
} from "../objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeHeadSin,
  snakeInOut,
  staticSnake,
} from "../effects/motion";
import { phase } from "../phase/phase";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "../effects/hue";
import { addEffect } from "../effects/effect";

const testSequence = async () => {
  const testAnimation = new Animation("agent", 95, 18, 81);
  testAnimation.sync(() => {
    // Empty animation
  });

  console.log("sending sequence");
  await sendSequence("agent", testAnimation.getSequence());
  await startSong("agent", 0);
};

(async () => {
  await testSequence();
})();
