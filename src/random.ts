import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats, cycleBeats } from "./time/time";
import { elements, segment } from "./objects/elements";
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

const animationName = "random";
const SECONDS_PER_PATTERN = 30;
const NUM_PATTERNS = 1;
const TOTAL_SECONDS = SECONDS_PER_PATTERN * NUM_PATTERNS;
const BPM = 60;
const TOTAL_BEATS = (TOTAL_SECONDS * BPM) / 60;

const pattern = (i: number, cb: Function) => {
  beats(i * SECONDS_PER_PATTERN, (i + 1) * SECONDS_PER_PATTERN, cb);
};

const random = async () => {
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
    beats(0, TOTAL_BEATS, () => {
      elements(all, () => {
        cycleBeats(SECONDS_PER_PATTERN, 0, 0.5, () => {
          fadeIn();
        });
        cycleBeats(SECONDS_PER_PATTERN, SECONDS_PER_PATTERN - 0.5, SECONDS_PER_PATTERN, () => {
          fadeOut();
        });
      });
    });
  });

  const seq = r.getSequence();
  await sendSequence(animationName, seq);
  await trigger(animationName);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise<void>((resolve) => {
    readline.question('Enter category (0=skip, 1=party, 2=chill, 3=mystery, 4=psychedelic, 5=background): ', async (categoryStr: string) => {
      const category = parseInt(categoryStr) || 0;
      
      if (category === 0) {
        readline.close();
        resolve();
        return;
      }

      const categories = ['', 'party', 'chill', 'mystery', 'psychedelic', 'background'];
      const categoryName = categories[category];
      const filename = Math.random().toString(36).substring(2, 6);
      await storeInFile(seq, filename, categoryName);
      readline.close();
      resolve();
    });
  });

};

const storeInFile = async (seq: SequencePerThing, filename: string, categoryName: string) => {
  const fs = require('fs');
  const path = require('path');

  const presetsDir = path.join(__dirname, '..', 'presets');
  if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir);
  }

  const filePath = path.join(presetsDir, `${categoryName}/${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(seq, null, 2));

  console.log(`Sequence for ${animationName} saved successfully to ${filePath}`);
}

(async () => {
  for (let i = 0; i < 100; i++) {
  await random();
  }
})();
