// Conservative review of the piano after the first drop. The returning
// phrases had inherited long echo chains from the intro. Mixed-audio onset
// and harmonic-envelope checks do not establish clearly audible echoes, so
// retain only the initial attack. Never infer a repeat from the intro template.
// End at the earlier of the original head, a nearby detected note-off, or one
// measured beat. These are short-note fallbacks, not isolated-stem ground truth.
// Source timings remain in children-continuation.ts to preserve travel slots.
export const PIANO_ARTICULATIONS = [
  { startSeconds: 42.080, endSeconds: 44.643, pitch: 77, attackEndSeconds: 42.370 },
  { startSeconds: 45.366, endSeconds: 48.011, pitch: 75, attackEndSeconds: 45.804 },
  { startSeconds: 48.864, endSeconds: 51.508, pitch: 72, attackEndSeconds: 49.107 },
  { startSeconds: 52.372, endSeconds: 55.644, pitch: 68, attackEndSeconds: 52.593 },
  { startSeconds: 56.102, endSeconds: 58.723, pitch: 77, attackEndSeconds: 56.330 },
  { startSeconds: 59.377, endSeconds: 62.005, pitch: 75, attackEndSeconds: 59.559 },
  { startSeconds: 65.081, endSeconds: 65.693, pitch: 67, attackEndSeconds: 65.314 },
  { startSeconds: 66.395, endSeconds: 69.798, pitch: 65, attackEndSeconds: 66.627 },
  { startSeconds: 70.124, endSeconds: 72.687, pitch: 77, attackEndSeconds: 70.495 },
  { startSeconds: 73.399, endSeconds: 76.055, pitch: 75, attackEndSeconds: 73.689 },
  { startSeconds: 76.920, endSeconds: 79.552, pitch: 72, attackEndSeconds: 77.140 },
  { startSeconds: 80.417, endSeconds: 83.688, pitch: 68, attackEndSeconds: 80.637 },
  { startSeconds: 84.146, endSeconds: 86.760, pitch: 77, attackEndSeconds: 84.274 },
  { startSeconds: 87.421, endSeconds: 90.049, pitch: 75, attackEndSeconds: 87.603 },
  { startSeconds: 93.126, endSeconds: 93.737, pitch: 67, attackEndSeconds: 93.346 },
  { startSeconds: 94.427, endSeconds: 97.842, pitch: 65, attackEndSeconds: 94.543 },
  { startSeconds: 133.206, endSeconds: 135.769, pitch: 77, attackEndSeconds: 133.644 },
  { startSeconds: 136.482, endSeconds: 139.137, pitch: 75, attackEndSeconds: 136.715 },
  { startSeconds: 139.980, endSeconds: 142.634, pitch: 72, attackEndSeconds: 140.224 },
  { startSeconds: 143.500, endSeconds: 146.770, pitch: 68, attackEndSeconds: 143.721 },
  { startSeconds: 147.228, endSeconds: 149.820, pitch: 77, attackEndSeconds: 147.456 },
  { startSeconds: 150.493, endSeconds: 153.131, pitch: 75, attackEndSeconds: 150.685 },
  { startSeconds: 156.186, endSeconds: 156.819, pitch: 67, attackEndSeconds: 156.406 },
  { startSeconds: 157.499, endSeconds: 160.902, pitch: 65, attackEndSeconds: 157.731 },
  { startSeconds: 161.217, endSeconds: 163.780, pitch: 77, attackEndSeconds: 161.368 },
  { startSeconds: 164.504, endSeconds: 167.148, pitch: 75, attackEndSeconds: 164.910 },
  { startSeconds: 168.012, endSeconds: 170.645, pitch: 72, attackEndSeconds: 168.245 },
  { startSeconds: 171.510, endSeconds: 174.781, pitch: 68, attackEndSeconds: 171.626 },
  { startSeconds: 175.251, endSeconds: 177.860, pitch: 77, attackEndSeconds: 175.467 },
  { startSeconds: 178.526, endSeconds: 181.142, pitch: 75, attackEndSeconds: 178.696 },
  { startSeconds: 184.218, endSeconds: 184.830, pitch: 67, attackEndSeconds: 184.656 },
  { startSeconds: 185.532, endSeconds: 188.923, pitch: 65, attackEndSeconds: 185.636 },
];
