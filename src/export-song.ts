import * as path from "path";
import * as fs from "fs";
import { recorder } from "./recorder/recorder";
import { setRecordingMode } from "./effects/effect";
import { Animation } from "./animation/animation";

async function main() {
  const songPath = process.argv[2];
  if (!songPath) {
    console.error("Usage: ts-node src/export-song.ts <path-to-song.ts>");
    process.exit(1);
  }

  const absolutePath = path.resolve(songPath);

  // Mock network services to prevent HTTP calls
  const seqModule = require("./services/sequence");
  const trigModule = require("./services/trigger");
  const origSend = seqModule.sendSequence;
  const origStart = trigModule.startSong;
  const origTrigger = trigModule.trigger;
  const origStop = trigModule.stop;
  seqModule.sendSequence = async () => {};
  trigModule.startSong = async () => {};
  trigModule.trigger = async () => {};
  trigModule.stop = async () => {};

  // Capture Animation metadata by patching sync()
  let songMeta: { name: string; bpm: number; lengthSeconds: number; startOffsetMs: number } | null = null;
  const originalSync = Animation.prototype.sync;
  Animation.prototype.sync = function (cb: Function) {
    songMeta = {
      name: this.name,
      bpm: this.bpm,
      lengthSeconds: this.totalTimeSeconds,
      startOffsetMs: this.startOffsetMs,
    };
    recorder.setBpm(this.bpm, this.startOffsetMs);
    return originalSync.call(this, cb);
  };

  // Enable recording and run the song
  setRecordingMode(true);
  recorder.reset();

  try {
    require(absolutePath);
    // Wait for async IIFE to complete
    await new Promise((resolve) => setTimeout(resolve, 200));
  } catch (err: any) {
    // Ignore network errors from any unmocked paths
    if (!err.message?.includes("ECONNREFUSED")) {
      throw err;
    }
  }

  // Restore
  setRecordingMode(false);
  Animation.prototype.sync = originalSync;
  seqModule.sendSequence = origSend;
  trigModule.startSong = origStart;
  trigModule.trigger = origTrigger;
  trigModule.stop = origStop;

  if (!songMeta) {
    console.error("No Animation was created. Check the song file.");
    process.exit(1);
  }

  const result = recorder.getResult(songMeta);

  const outputPath = absolutePath.replace(/\.ts$/, ".json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Exported ${result.timeframes.length} timeframes to ${outputPath}`);
}

main();
