import { sendSequence } from "../services/sequence";
import { startSong } from "../services/trigger";
import { Animation } from "../animation/animation";
import { section } from "../time/time";
import { story2Effects } from "./agent_story2-options";

// Agent story 2: a text being read, 24.08 s (agent_story2.wav). No beat grid: at 60 BPM a beat is a second, so the
// timings are in seconds into the reading.
// The whole reading is one steady background, the option picked in the gallery (ui/background-gallery.html?set=
// agent_story2, src/songs/agent_story2-options.ts): option 135, a rainbow along rad, mottled, ripples along rad, hue
// waves round the small rings running against them and the b1 and b2 dots trading places on top, in 4 groups a
// quarter of a cycle apart.
const PICKED = 135;

const agentStory2 = async () => {
  const anim = new Animation("agent_story2", 60, 24.08, 0);
  // Play once (the rings stay dark after it), the length of the audio, so the start does not come round again.
  anim.playOnce();
  anim.sync(() => {
    section("agent_story2", { start: 0, end: 25 }, () => {
      story2Effects(PICKED - 1);
    });
  });

  // As in agent_story: these rings are also shown on the lilum pendants.
  anim.mirrorToLilum([1, 4, 5, 7, 10]);
  console.log("sending sequence");
  await sendSequence("agent_story2", anim.getSequence());
  if (!process.env.SEND_ONLY) {
    await startSong("agent_story2", 0);
  }
};

(async () => {
  await agentStory2();
})();
