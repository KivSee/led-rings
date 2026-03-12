/**
 * CLI tool: parse a .ts song file and export to JSON.
 * Usage: npx ts-node src/export-song.ts <path-to-song.ts>
 */
import * as path from "path";
import * as fs from "fs";
import { parseSongFile } from "./recorder/parse-song";

async function main() {
  const songPath = process.argv[2];
  if (!songPath) {
    console.error("Usage: ts-node src/export-song.ts <path-to-song.ts>");
    process.exit(1);
  }

  const absolutePath = path.resolve(songPath);
  const result = await parseSongFile(absolutePath);

  const outputPath = absolutePath.replace(/\.ts$/, ".json");
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Exported ${result.timeframes.length} timeframes to ${outputPath}`);
}

main();
