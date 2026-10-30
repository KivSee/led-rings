// Estimated percussion attacks from the local Children recording.
// 8 ms band RMS (180–900 / 900–3000 / 3000–10000 Hz), 2.5 ms hop;
// positive 10 ms log-energy change locates attacks, then backtrack to 20%.
// Levels retain measured low/mid attack strength; these are not isolated drums.
export interface ChildrenDrumHit { startSeconds: number; strength: number; }

export const DRUM_ROLLS: Array<{ finale: boolean; hits: ChildrenDrumHit[] }> = [
  { finale: false, hits: [
    { startSeconds: 222.322, strength: 0.532 },
    { startSeconds: 222.433, strength: 0.432 },
    { startSeconds: 222.542, strength: 0.835 },
    { startSeconds: 222.650, strength: 0.509 },
    { startSeconds: 222.760, strength: 0.519 },
    { startSeconds: 222.873, strength: 0.450 },
    { startSeconds: 222.982, strength: 0.865 },
    { startSeconds: 223.090, strength: 0.491 },
    { startSeconds: 223.197, strength: 0.499 },
    { startSeconds: 223.308, strength: 0.472 },
    { startSeconds: 223.420, strength: 0.885 },
    { startSeconds: 223.528, strength: 0.440 },
    { startSeconds: 223.635, strength: 0.412 },
    { startSeconds: 223.745, strength: 0.437 },
    { startSeconds: 223.855, strength: 0.771 },
    { startSeconds: 223.965, strength: 0.507 },
    { startSeconds: 224.075, strength: 0.740 },
    { startSeconds: 224.188, strength: 0.715 },
    { startSeconds: 224.300, strength: 0.946 },
  ] },
  { finale: true, hits: [
    { startSeconds: 236.345, strength: 0.740 },
    { startSeconds: 236.455, strength: 0.402 },
    { startSeconds: 236.567, strength: 0.810 },
    { startSeconds: 236.678, strength: 0.862 },
    { startSeconds: 236.785, strength: 0.761 },
    { startSeconds: 236.893, strength: 0.778 },
    { startSeconds: 237.005, strength: 1.000 },
    { startSeconds: 237.115, strength: 0.893 },
    { startSeconds: 237.215, strength: 0.716 },
    { startSeconds: 237.335, strength: 0.868 },
    { startSeconds: 237.445, strength: 0.660 },
    { startSeconds: 237.555, strength: 0.686 },
    { startSeconds: 237.662, strength: 0.641 },
    { startSeconds: 237.770, strength: 0.773 },
    { startSeconds: 237.887, strength: 0.991 },
    { startSeconds: 237.990, strength: 0.709 },
    { startSeconds: 238.097, strength: 0.904 },
    { startSeconds: 238.213, strength: 1.000 },
    { startSeconds: 238.325, strength: 0.870 },
  ] },
];

// The slower, stronger mid-band drum attacks in displayed bar 134.
export const PRE_FINALE_DRUM_HITS: ChildrenDrumHit[] = [
  { startSeconds: 234.817, strength: 1.000 },
  { startSeconds: 235.252, strength: 0.918 },
  { startSeconds: 235.692, strength: 0.836 },
  { startSeconds: 236.132, strength: 0.926 },
];

// Final cymbal swell after the last fast hit; leave its decay room to settle.
export const DRUM_FINALE_RESOLVE_SECONDS = 238.415;
