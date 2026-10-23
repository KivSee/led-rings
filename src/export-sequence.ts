/**
 * CLI tool: run a .ts song and save the sequence it would send to the rings, instead of sending it.
 * Usage: npx ts-node src/export-sequence.ts <path-to-song.ts> [out.json]
 * The default output is ui/public/<song>.sequence.json, which the Sequence Player (ui/player.html) plays.
 */
import * as path from "path";
import * as fs from "fs";
import * as sequence from "./services/sequence";

const songPath = process.argv[2];
if (!songPath) {
  console.error("Usage: ts-node src/export-sequence.ts <path-to-song.ts> [out.json]");
  process.exit(1);
}
const songName = path.basename(songPath, ".ts");
const outPath = process.argv[3] ?? path.join(__dirname, "../ui/public", `${songName}.sequence.json`);

// The song calls sendSequence() when it is done; write the sequence to a file instead.
process.env.SEND_ONLY = "1";
(sequence as { sendSequence: typeof sequence.sendSequence }).sendSequence = async (_trigger, seq) => {
  fs.writeFileSync(outPath, JSON.stringify(seq));
  const counts = Object.entries(seq).map(([thing, s]) => `${thing}: ${s.effects.length}`).join(", ");
  console.log(`Saved ${outPath} (${counts})`);
};
require(path.resolve(songPath));
