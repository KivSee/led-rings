import { sendSequence } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats, cycleBeats } from "./time/time";
import { elements, segment } from "./objects/elements";
import fs from "fs";
import {
  all,
  even,
  odd,
  segment_arc,
  segment_b1,
  segment_b2,
} from "./objects/ring-elements";
import {
  constColor,
  fullRainbow,
  noColor,
  pastel,
  randomRangeColor,
  vivid,
} from "./effects/coloring";
import { phase } from "./phase/phase";
import { fadeIn, fadeOut } from "./effects/brightness";
import { snake, snakeInOut } from "./effects/motion";
import { addRandomColoring } from "./random/coloring";
import { addRandomBrightness } from "./random/brightness";
import { addRandomMotion } from "./random/motion";
import { addRandomDynamicHue } from "./random/dynamichue";
import { timeStamp } from "console";

const animationName = "random";
const SECONDS_PER_PATTERN = 1;
// const NUM_PATTERNS = 30;
const NUM_PATTERNS = 1;
const TOTAL_SECONDS = SECONDS_PER_PATTERN * NUM_PATTERNS;
const BPM = 60;
const TOTAL_BEATS = (TOTAL_SECONDS * BPM) / 60;



const pattern = (i: number, cb: Function) => {
  beats(i * SECONDS_PER_PATTERN, (i + 1) * SECONDS_PER_PATTERN, cb);
};

const random = async () => {
  for (let file_index = 0; file_index < 100; file_index++) {
    const r = new Animation(animationName, BPM, TOTAL_SECONDS);

    r.sync(() => {
      for (let i = 0; i < NUM_PATTERNS; i++) {
        pattern(i, () => {
          addRandomColoring();
          addRandomDynamicHue();
          addRandomBrightness();
          addRandomMotion();
          addRandomMotion();
        });
      }
    });

    const seq = r.getSequence();
    console.log(JSON.stringify(seq, null, 2).length);
    console.log(`Sending sequence for ${animationName}...`);
    console.log(JSON.stringify(seq, null, 2));

    // seq.forEach([_, obj] => {
    //   // Send the sequence to the server
    //   s.forEach(element => {

    //   }); (s);

    // const timestamp = new Date().toISOString();
    const BASED_DIR = '/Users/sapir/repos/cursor_repos/lol/animation/compounds/rand_bank';
    const dir = `${BASED_DIR}/`;

    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating directory:", err);
        return;
      }
      fs.open(
        `${dir}${animationName}_${file_index}.json`,
        "w+",
        (err, fd) => {
          if (err) {
            console.error("Error opening file:", err);
            return;
          }
          fs.write(fd, JSON.stringify(seq, null, 2), (err) => {
            if (err) {
              console.error("Error writing to file:", err);
            } else {
              console.log(`Sequence for ${animationName} saved successfully.`);
            }
            fs.close(fd, (err) => {
              if (err) {
                console.error("Error closing file:", err);
              }
            });
          });
        }
      );
    });
  }
};

(async () => {
  await random();
})();
