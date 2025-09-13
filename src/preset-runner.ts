import { sendSequence, SequencePerThing } from "./services/sequence";
import { trigger } from "./services/trigger";
import * as fs from 'fs';
import * as path from 'path';

const PRESET_DURATION_MS = 30000; // 30 seconds per preset

const runPresets = async (categoryName: string) => {
  const presetsDir = path.join(__dirname, '..', 'presets', categoryName);
  
  if (!fs.existsSync(presetsDir)) {
    console.error(`Preset directory not found: ${presetsDir}`);
    console.log('Available categories: party, chill, mystery, psychedelic, background');
    return;
  }

  const files = fs.readdirSync(presetsDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(`No preset files found in ${categoryName} directory`);
    return;
  }

  console.log(`Found ${files.length} preset files in ${categoryName} category`);
  console.log('Merging presets into one continuous sequence...\n');

  // Merge all sequences into one
  const mergedSequence: SequencePerThing = {};
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(presetsDir, file);
    
    try {
      console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
      
      // Read and parse the preset file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const sequence: SequencePerThing = JSON.parse(fileContent);
      
      // Calculate time offset for this preset
      const timeOffset = i * PRESET_DURATION_MS;
      
      // Process each ring in the sequence
      Object.keys(sequence).forEach(ringKey => {
        if (!mergedSequence[ringKey]) {
          mergedSequence[ringKey] = {
            effects: [],
            duration_ms: 0,
            num_repeats: 0
          };
        }
        
        // Adjust timing for all effects in this ring
        const adjustedEffects = sequence[ringKey].effects.map(effect => ({
          ...effect,
          effect_config: {
            ...effect.effect_config,
            start_time: effect.effect_config.start_time + timeOffset,
            end_time: effect.effect_config.end_time + timeOffset
          }
        }));
        
        // Add the adjusted effects to the merged sequence
        mergedSequence[ringKey].effects.push(...adjustedEffects);
      });
      
      console.log(`  Added to merged sequence with time offset: ${timeOffset}ms`);
      
    } catch (error) {
      console.error(`Error processing preset ${file}:`, error);
      console.log('Continuing to next preset...\n');
    }
  }
  
  // Update the total duration for each ring
  const totalDuration = files.length * PRESET_DURATION_MS;
  Object.keys(mergedSequence).forEach(ringKey => {
    mergedSequence[ringKey].duration_ms = totalDuration;
  });
  
  console.log(`\nMerged sequence created with total duration: ${totalDuration}ms (${totalDuration / 1000} seconds)`);
  console.log('Starting merged sequence playback...\n');
  
  // Create a unique trigger name for the merged sequence
  const triggerName = `preset-merged-${categoryName}`;
  
  // Send the merged sequence and trigger it
  await sendSequence(triggerName, mergedSequence);
  await trigger(triggerName);
  
  console.log('Merged sequence started! It will play all presets continuously.');
};

// Get category from command line arguments
const categoryName = process.argv[2];

if (!categoryName) {
  console.log('Usage: yarn preset <category>');
  console.log('Available categories: party, chill, mystery, psychedelic, background');
  process.exit(1);
}

// Run the presets
(async () => {
  try {
    await runPresets(categoryName);
  } catch (error) {
    console.error('Error running presets:', error);
    process.exit(1);
  }
})();
