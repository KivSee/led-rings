import { sendSequence, SequencePerThing } from "../services/sequence";
import { startSong } from "../services/trigger";
import { NUMBER_OF_RINGS } from "../sys-config/sys-config";

// Agent 1: the first chip's song, 15.013 s (agent1.wav). Dark on purpose: the audio plays with all the LEDs off.
// Every ring gets a part with no effects. Animation.getSequence() leaves out rings without effects, and a thing
// without a part gets a 404 when it fetches the sequence, which the pendants show as their green idle dot.
// The pendants play these parts too (the placement in led-sequence-service), so they need no parts of their own.
const DURATION_MS = 15013;

const agent1 = async () => {
  const sequence: SequencePerThing = {};
  for (let ring = 1; ring <= NUMBER_OF_RINGS; ring++) {
    sequence[`ring${ring}`] = { effects: [], duration_ms: DURATION_MS, num_repeats: 1 };
  }

  console.log("sending sequence");
  await sendSequence("agent1", sequence);
  if (!process.env.SEND_ONLY) {
    await startSong("agent1", 0);
  }
};

(async () => {
  await agent1();
})();
