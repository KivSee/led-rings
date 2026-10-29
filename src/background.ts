import * as fs from "fs";
import * as path from "path";
import { sendSequence } from "./services/sequence";
import { trigger } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats } from "./time/time";
import { elements } from "./objects/elements";
import { all } from "./objects/ring-elements";
import { fade } from "./effects/brightness";
import { optionEffects } from "./background-options";

// Background: a calm loop for between songs and for transitions. It plays the options starred in the background
// gallery (ui/background-gallery.html, saved to background-picks.json), in their order, OPTION_SECONDS each, and then
// starts again. Each one fades in over its first FADE seconds and out over its last, so they pass into each other
// through a short dip instead of a cut. At 60 BPM a beat is a second.
const animationName = "background";
const BPM = 60;
const OPTION_SECONDS = 15, FADE = 1;

const picks: { option: number; name: string }[] = JSON.parse(fs.readFileSync(path.join(__dirname, "background-picks.json"), "utf8"));

const background = async () => {
  const loopSeconds = picks.length * OPTION_SECONDS;
  const anim = new Animation(animationName, BPM, loopSeconds);

  anim.sync(() => picks.forEach(({ option }, k) => {
    const from = k * OPTION_SECONDS, to = from + OPTION_SECONDS;
    optionEffects(option - 1, from, to);
    elements(all, () => {
      beats(from, from + FADE, () => fade({ start: 0, end: 1 }));
      beats(to - FADE, to, () => fade({ start: 1, end: 0 }));
    });
  }));

  console.log(`background: ${picks.length} options, ${OPTION_SECONDS} s each (${loopSeconds} s): ${picks.map(p => p.option).join(", ")}`);
  await sendSequence(animationName, anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await trigger(animationName);
  }
};

(async () => {
  await background();
})();
