/** A transcribed note, positioned in seconds from the start of the song's audio. */
export interface MidiNote {
  startSeconds: number;
  endSeconds: number;
  pitch: number;
  instrument?: "piano" | "guitar" | "synth" | "pad" | "bass";
  buildRole?: "low" | "high";
  accent?: "bar-low";
}
