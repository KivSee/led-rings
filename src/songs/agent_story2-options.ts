// Options for agent story 2 (a text being read, agent_story2.wav) for the gallery (ui/background-gallery.html?set=
// agent_story2), played side by side with the reading: the same steady background options as agent story 1
// (src/songs/agent_story1-options.ts), over this reading's length.
// Run it (npx ts-node src/songs/agent_story2-options.ts) to write ui/public/agent_story2-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "../animation/animation";
import { OPTIONS, optionEffects } from "./agent_story1-options";

// At 60 BPM a beat is a second.
const NAME = "agent_story2", BPM = 60, LENGTH = 24.08, END = 25;

export { OPTIONS };
export const story2Effects = (i: number) => optionEffects(i, END);

export const optionSequence = (i: number) => {
  const anim = new Animation(NAME, BPM, LENGTH, 0);
  anim.sync(() => story2Effects(i));
  return anim.getSequence();
};

if (require.main === module) {
  const out = path.join(__dirname, "..", "..", "ui", "public", `${NAME}-options.json`);
  const options = OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: optionSequence(i) }));
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LENGTH, audio: `${NAME}.wav`, options }));
  console.log(`Saved ${out}: ${options.length} options`);
}
