import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import * as fs from 'fs';
import * as path from 'path';

const playPreset = async (presetPath: string) => {
  if (!fs.existsSync(presetPath)) {
    // Try resolving relative to presets directory
    const resolvedPath = path.join(__dirname, '..', 'presets', presetPath);
    if (fs.existsSync(resolvedPath)) {
      presetPath = resolvedPath;
    } else if (fs.existsSync(resolvedPath + '.json')) {
      presetPath = resolvedPath + '.json';
    } else {
      console.error(`Preset not found: ${presetPath}`);
      console.log('\nUsage:');
      console.log('  yarn play <category/name>     e.g. yarn play party/spin');
      console.log('  yarn play <path-to-file.json>  e.g. yarn play presets/party/spin.json');
      listAvailable();
      process.exit(1);
    }
  }

  const fileContent = fs.readFileSync(presetPath, 'utf8');
  const sequence: SequencePerThing = JSON.parse(fileContent);

  const presetName = path.basename(presetPath, '.json');
  const triggerName = `preset-${presetName}`;

  console.log(`Playing preset: ${presetPath}`);
  await sendSequence(triggerName, sequence);
  await trigger(triggerName);
  console.log(`Preset "${presetName}" is now playing.`);
};

const listAvailable = () => {
  const presetsDir = path.join(__dirname, '..', 'presets');
  if (!fs.existsSync(presetsDir)) return;

  console.log('\nAvailable presets:');
  const categories = fs.readdirSync(presetsDir).filter(d =>
    fs.statSync(path.join(presetsDir, d)).isDirectory()
  );
  for (const cat of categories) {
    const files = fs.readdirSync(path.join(presetsDir, cat))
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
    console.log(`  ${cat}: ${files.join(', ')}`);
  }
};

const input = process.argv[2];

if (!input) {
  console.log('Usage:');
  console.log('  yarn play <category/name>     e.g. yarn play party/spin');
  console.log('  yarn play <path-to-file.json>  e.g. yarn play presets/party/spin.json');
  listAvailable();
  process.exit(1);
}

(async () => {
  try {
    await playPreset(input);
  } catch (error) {
    console.error('Error playing preset:', error);
    process.exit(1);
  }
})();
