export interface ChildrenBassNote {
  startSeconds: number;
  endSeconds: number;
  pitch: number;
  soft: boolean;
}

// User-marked intro beats use the player's 136 BPM grid. The first five keep
// their brighter four-beat breaths; later F notes sustain across two bars.
const intro = [
  { beat: 4, duration: 4, pitch: 34 },
  { beat: 8, duration: 4, pitch: 41 },
  { beat: 16, duration: 4, pitch: 37 },
  { beat: 20, duration: 4, pitch: 34 },
  { beat: 24, duration: 4, pitch: 41 },
  { beat: 32, duration: 4, pitch: 37 },
  { beat: 36, duration: 4, pitch: 34 },
  { beat: 40, duration: 8, pitch: 41 },
  { beat: 48, duration: 4, pitch: 37 },
  { beat: 52, duration: 4, pitch: 34 },
  { beat: 56, duration: 8, pitch: 41 },
].map(({ beat, duration, pitch }) => ({
  startSeconds: beat * 60 / 136,
  endSeconds: (beat + duration) * 60 / 136,
  pitch, soft: beat >= 32,
}));

// Estimated bass returns from the recording, independently checked across both
// passages. A 512 ms Hann spectrum / 20 ms hop follows narrow bass peaks and
// their first two harmonics; a 500 ms median rejects short kick transients.
// Boundaries mark persistent pitch changes, not every drum hit. F1/F2 share
// the representative F2 pitch, keeping the intro color scale consistent.
// Long F pedals at 98–133 s and 189 s onward are not repeated note attacks.
export const BASS_NOTES: ChildrenBassNote[] = [
  ...intro,
  { startSeconds: 42.076, endSeconds: 43.828, pitch: 37, soft: true },
  { startSeconds: 43.976, endSeconds: 45.676, pitch: 34, soft: true },
  { startSeconds: 45.676, endSeconds: 49.180, pitch: 41, soft: true },
  { startSeconds: 49.276, endSeconds: 51.028, pitch: 37, soft: true },
  { startSeconds: 51.036, endSeconds: 52.676, pitch: 34, soft: true },
  { startSeconds: 52.676, endSeconds: 56.180, pitch: 41, soft: true },
  { startSeconds: 56.316, endSeconds: 57.996, pitch: 37, soft: true },
  { startSeconds: 57.996, endSeconds: 59.748, pitch: 34, soft: true },
  { startSeconds: 59.776, endSeconds: 63.156, pitch: 41, soft: true },
  { startSeconds: 63.156, endSeconds: 64.908, pitch: 37, soft: true },
  { startSeconds: 64.936, endSeconds: 66.688, pitch: 34, soft: true },
  { startSeconds: 66.776, endSeconds: 70.196, pitch: 41, soft: true },
  { startSeconds: 70.196, endSeconds: 71.948, pitch: 37, soft: true },
  { startSeconds: 71.996, endSeconds: 73.748, pitch: 34, soft: true },
  { startSeconds: 73.776, endSeconds: 77.176, pitch: 41, soft: true },
  { startSeconds: 77.176, endSeconds: 78.928, pitch: 37, soft: true },
  { startSeconds: 78.996, endSeconds: 80.748, pitch: 34, soft: true },
  { startSeconds: 80.856, endSeconds: 84.216, pitch: 41, soft: true },
  { startSeconds: 84.216, endSeconds: 85.968, pitch: 37, soft: true },
  { startSeconds: 86.016, endSeconds: 87.768, pitch: 34, soft: true },
  { startSeconds: 87.816, endSeconds: 91.156, pitch: 41, soft: true },
  { startSeconds: 91.156, endSeconds: 92.908, pitch: 37, soft: true },
  { startSeconds: 92.916, endSeconds: 94.668, pitch: 34, soft: true },
  { startSeconds: 94.816, endSeconds: 98.320, pitch: 41, soft: true },
  { startSeconds: 133.136, endSeconds: 134.888, pitch: 37, soft: true },
  { startSeconds: 135.016, endSeconds: 136.768, pitch: 34, soft: true },
  { startSeconds: 136.816, endSeconds: 140.256, pitch: 41, soft: true },
  { startSeconds: 140.256, endSeconds: 142.008, pitch: 37, soft: true },
  { startSeconds: 142.076, endSeconds: 143.828, pitch: 34, soft: true },
  { startSeconds: 143.916, endSeconds: 147.256, pitch: 41, soft: true },
  { startSeconds: 147.256, endSeconds: 149.008, pitch: 37, soft: true },
  { startSeconds: 149.016, endSeconds: 150.768, pitch: 34, soft: true },
  { startSeconds: 150.956, endSeconds: 154.396, pitch: 41, soft: true },
  { startSeconds: 154.396, endSeconds: 156.076, pitch: 37, soft: true },
  { startSeconds: 156.076, endSeconds: 157.828, pitch: 34, soft: true },
  { startSeconds: 157.896, endSeconds: 161.156, pitch: 41, soft: true },
  { startSeconds: 161.156, endSeconds: 162.908, pitch: 37, soft: true },
  { startSeconds: 163.076, endSeconds: 164.828, pitch: 34, soft: true },
  { startSeconds: 164.916, endSeconds: 168.316, pitch: 41, soft: true },
  { startSeconds: 168.316, endSeconds: 170.068, pitch: 37, soft: true },
  { startSeconds: 170.076, endSeconds: 171.828, pitch: 34, soft: true },
  { startSeconds: 171.996, endSeconds: 175.276, pitch: 41, soft: true },
  { startSeconds: 175.276, endSeconds: 177.028, pitch: 37, soft: true },
  { startSeconds: 177.136, endSeconds: 178.888, pitch: 34, soft: true },
  { startSeconds: 178.936, endSeconds: 182.376, pitch: 41, soft: true },
  { startSeconds: 182.376, endSeconds: 184.116, pitch: 37, soft: true },
  { startSeconds: 184.116, endSeconds: 185.868, pitch: 34, soft: true },
  { startSeconds: 185.916, endSeconds: 189.420, pitch: 41, soft: true },
];
