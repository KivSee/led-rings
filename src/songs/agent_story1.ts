import { sendSequence } from "../services/sequence";
import { startSong } from "../services/trigger";
import { Animation } from "../animation/animation";
import { section } from "../time/time";
import { optionEffects } from "./agent_story1-options";

// Agent story 1: a text being read, 23.59 s (agent_story1.wav). No beat grid: at 60 BPM a beat is a second, so the
// timings are in seconds into the reading.
// The whole reading is one steady background, the option picked in the gallery (ui/background-gallery.html?set=
// agent_story1, src/songs/agent_story1-options.ts): option 75, a rainbow round the big ring with half moons, double
// ripples along rad, hue waves round the small rings running against them and white glitter on top, each ring a
// twelfth of a cycle behind the one before.
const PICKED = 75;

const agentStory1 = async () => {
  const anim = new Animation("agent_story1", 60, 23.59, 0);
  // Play once (the rings stay dark after it), the length of the audio, so the start does not come round again.
  anim.playOnce();
  anim.sync(() => {
    section("agent_story1", { start: 0, end: 24 }, () => {
      optionEffects(PICKED - 1);
    });
  });

  // As in agent_story: these rings are also shown on the lilum pendants.
  anim.mirrorToLilum([1, 4, 5, 7, 10]);
  console.log("sending sequence");
  await sendSequence("agent_story1", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("agent_story1", 0);
  }
};

(async () => {
  await agentStory1();
})();
