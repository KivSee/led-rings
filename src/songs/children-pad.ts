export interface ChildrenPadNote {
  startSeconds: number;
  endSeconds: number;
  pitch: number;
  level: number;
}

// Rhythm-guided sustained synth estimate from the mixed recording.
// Fundamental-register note activations reveal F5–E♭5–C5, then F5–G5–A♭5;
// a C6-heavy upper-partial detector had incorrectly flattened this to one note.
// Detected attacks refine the boundaries; masked returns use the repeating
// 32-beat phrase only where fundamental-band energy supports the note.
// The last phrase settles back to F5. This is not an isolated synth stem.
export const PAD_PASSAGES: ChildrenPadNote[][] = [
  [
    { startSeconds: 42.080, endSeconds: 43.844, pitch: 77, level: 1.000 },
    { startSeconds: 43.844, endSeconds: 45.900, pitch: 75, level: 1.000 },
    { startSeconds: 45.900, endSeconds: 49.421, pitch: 72, level: 1.000 },
    { startSeconds: 49.421, endSeconds: 50.862, pitch: 77, level: 1.000 },
    { startSeconds: 50.862, endSeconds: 52.593, pitch: 79, level: 1.000 },
    { startSeconds: 52.593, endSeconds: 56.102, pitch: 80, level: 1.000 },
    { startSeconds: 56.102, endSeconds: 58.170, pitch: 77, level: 1.000 },
    { startSeconds: 58.170, endSeconds: 59.609, pitch: 75, level: 1.000 },
    { startSeconds: 59.609, endSeconds: 63.130, pitch: 72, level: 1.000 },
    { startSeconds: 63.130, endSeconds: 64.954, pitch: 77, level: 1.000 },
    { startSeconds: 64.954, endSeconds: 66.609, pitch: 79, level: 1.000 },
    { startSeconds: 66.609, endSeconds: 70.124, pitch: 80, level: 1.000 },
    { startSeconds: 70.124, endSeconds: 71.865, pitch: 77, level: 1.000 },
    { startSeconds: 71.865, endSeconds: 74.062, pitch: 75, level: 1.000 },
    { startSeconds: 74.062, endSeconds: 77.121, pitch: 72, level: 1.000 },
    { startSeconds: 77.121, endSeconds: 78.873, pitch: 77, level: 1.000 },
    { startSeconds: 78.873, endSeconds: 80.625, pitch: 79, level: 1.000 },
    { startSeconds: 80.625, endSeconds: 84.146, pitch: 80, level: 1.000 },
    { startSeconds: 84.146, endSeconds: 85.882, pitch: 77, level: 1.000 },
    { startSeconds: 85.882, endSeconds: 87.634, pitch: 75, level: 1.000 },
    { startSeconds: 87.634, endSeconds: 91.070, pitch: 72, level: 1.000 },
    { startSeconds: 91.070, endSeconds: 92.890, pitch: 77, level: 1.000 },
    { startSeconds: 92.890, endSeconds: 94.532, pitch: 79, level: 1.000 },
    { startSeconds: 94.532, endSeconds: 98.160, pitch: 77, level: 1.000 },
  ],
  // Return after the second drop, including the mini drop. Detected attacks
  // refine the same 32-beat contour; masked attacks keep the measured grid
  // only where persistent fundamental energy supports the held note.
  [
    { startSeconds: 133.206, endSeconds: 135.262, pitch: 77, level: 1.000 },
    { startSeconds: 135.262, endSeconds: 136.710, pitch: 75, level: 1.000 },
    { startSeconds: 136.710, endSeconds: 140.224, pitch: 72, level: 1.000 },
    { startSeconds: 140.224, endSeconds: 141.966, pitch: 77, level: 1.000 },
    { startSeconds: 141.966, endSeconds: 143.953, pitch: 79, level: 1.000 },
    { startSeconds: 143.953, endSeconds: 147.228, pitch: 80, level: 1.000 },
    { startSeconds: 147.228, endSeconds: 148.975, pitch: 77, level: 1.000 },
    { startSeconds: 148.975, endSeconds: 150.727, pitch: 75, level: 1.000 },
    { startSeconds: 150.727, endSeconds: 154.559, pitch: 72, level: 1.000 },
    { startSeconds: 154.559, endSeconds: 155.983, pitch: 77, level: 1.000 },
    { startSeconds: 155.983, endSeconds: 157.735, pitch: 79, level: 1.000 },
    { startSeconds: 157.735, endSeconds: 161.217, pitch: 80, level: 1.000 },
    { startSeconds: 161.217, endSeconds: 162.991, pitch: 77, level: 1.000 },
    { startSeconds: 162.991, endSeconds: 164.744, pitch: 75, level: 1.000 },
    { startSeconds: 164.744, endSeconds: 168.248, pitch: 72, level: 1.000 },
    { startSeconds: 168.248, endSeconds: 170.000, pitch: 77, level: 1.000 },
    { startSeconds: 170.000, endSeconds: 171.752, pitch: 79, level: 1.000 },
    { startSeconds: 171.752, endSeconds: 175.251, pitch: 80, level: 1.000 },
    { startSeconds: 175.251, endSeconds: 177.008, pitch: 77, level: 1.000 },
    { startSeconds: 177.008, endSeconds: 178.760, pitch: 75, level: 1.000 },
    { startSeconds: 178.760, endSeconds: 182.186, pitch: 72, level: 1.000 },
    { startSeconds: 182.186, endSeconds: 184.017, pitch: 77, level: 1.000 },
    { startSeconds: 184.017, endSeconds: 185.769, pitch: 79, level: 1.000 },
    { startSeconds: 185.769, endSeconds: 189.280, pitch: 77, level: 1.000 },
  ],
];

export const PAD_NOTES: ChildrenPadNote[] = PAD_PASSAGES.flat();
