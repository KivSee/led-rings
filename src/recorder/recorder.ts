import { als } from "../async-local-storage";

interface CycleInfo {
  type: "cycle" | "cycleBeats";
  beatsInCycle: number;
  startBeatInCycle?: number;
  endBeatInCycle?: number;
}

interface RecordedEffect {
  id: string;
  effectKey: string;
  params?: Record<string, any>;
  phase?: number;
}

interface RecordedTimeframe {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  color: string;
  hasExplicitColor?: boolean;
  rings: number[];
  mapping: string;
  phase?: number;
  cycles?: CycleInfo[];
  effects: RecordedEffect[];
}

interface SongMeta {
  name: string;
  bpm: number;
  lengthSeconds: number;
  startOffsetMs: number;
  animationType?: string;
}

function msToBeats(ms: number, bpm: number): number {
  return Math.round(ms * bpm / 60000 * 10) / 10;
}

function hsvToHex(h: number, s: number, v: number): string {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Normalize raw addEffect keys to the UI's expected effect key names. */
const EFFECT_KEY_ALIASES: Record<string, string> = {
  hue: "timed_hue",
  saturation: "timed_saturation",
};

class Recorder {
  private timeframes: RecordedTimeframe[] = [];
  private contextMap = new Map<string, RecordedTimeframe>();
  private tfCounter = 0;
  private effectCounter = 0;
  private bpm = 120;
  private startOffsetMs = 0;

  reset() {
    this.timeframes = [];
    this.contextMap.clear();
    this.tfCounter = 0;
    this.effectCounter = 0;
  }

  setBpm(bpm: number, startOffsetMs: number) {
    this.bpm = bpm;
    this.startOffsetMs = startOffsetMs;
  }

  recordEffect(effectKey: string, params: Record<string, any>) {
    const store = als.getStore();
    if (!store) return;

    const effectConfig = store.effectConfig || {};
    const startBeat = msToBeats((effectConfig.start_time ?? 0) - this.startOffsetMs, this.bpm);
    const endBeat = msToBeats((effectConfig.end_time ?? 0) - this.startOffsetMs, this.bpm);
    const rings: number[] = store.elements || [];
    const mapping: string = effectConfig.segments || "all";
    const phaseValue: number = store.phase || 0;

    // Build cycle info from cycleStack (preferred) or fall back to repeat_num reconstruction
    const cycles: CycleInfo[] = [];
    if (store.cycleStack && store.cycleStack.length > 0) {
      for (const entry of store.cycleStack) {
        if (entry.startBeat === 0 && entry.endBeat === entry.beatsInCycle) {
          cycles.push({ type: "cycle", beatsInCycle: entry.beatsInCycle });
        } else {
          cycles.push({
            type: "cycleBeats",
            beatsInCycle: entry.beatsInCycle,
            startBeatInCycle: entry.startBeat,
            endBeatInCycle: entry.endBeat,
          });
        }
      }
    } else if (effectConfig.repeat_num != null && effectConfig.repeat_num > 0) {
      const totalBeats = endBeat - startBeat;
      const beatsInCycle = Math.round(totalBeats / effectConfig.repeat_num * 10) / 10;
      const repeatStart = effectConfig.repeat_start ?? 0;
      const repeatEnd = effectConfig.repeat_end ?? 1;

      if (repeatStart === 0 && repeatEnd === 1) {
        cycles.push({ type: "cycle", beatsInCycle });
      } else {
        cycles.push({
          type: "cycleBeats",
          beatsInCycle,
          startBeatInCycle: Math.round(repeatStart * beatsInCycle * 10) / 10,
          endBeatInCycle: Math.round(repeatEnd * beatsInCycle * 10) / 10,
        });
      }
    }

    // Build context key for grouping
    const contextKey = JSON.stringify({ startBeat, endBeat, rings, mapping, phaseValue, cycles });

    let tf = this.contextMap.get(contextKey);
    if (!tf) {
      tf = {
        id: `tf-${this.tfCounter++}`,
        startTime: startBeat,
        endTime: endBeat,
        label: "",
        color: "#3b82f6",
        rings,
        mapping,
        effects: [],
      };
      if (phaseValue) tf.phase = phaseValue;
      if (cycles.length) tf.cycles = cycles;
      this.timeframes.push(tf);
      this.contextMap.set(contextKey, tf);
    }

    // constColor sets the timeframe color instead of being an effect
    if (effectKey === "constColor" && params.hue != null) {
      tf.color = hsvToHex(params.hue, params.sat ?? 1, params.val ?? 1);
      tf.hasExplicitColor = true;
      return;
    }

    // vivid/pastel set the timeframe color (same as constColor)
    if (effectKey === "vivid" && params.hue != null) {
      tf.color = hsvToHex(params.hue, 1, 1);
      tf.hasExplicitColor = true;
      return;
    }
    if (effectKey === "pastel") {
      tf.color = hsvToHex(params.hue ?? 0, 0.8, 1);
      tf.hasExplicitColor = true;
      return;
    }

    // noColor sets timeframe to black
    if (effectKey === "noColor") {
      tf.color = "#000000";
      tf.hasExplicitColor = true;
      return;
    }

    // rainbow → constColor + position_hue with linear offset
    if (effectKey === "rainbow") {
      const startHue = params?.startHue ?? 0;
      const endHue = params?.endHue ?? 1;
      tf.color = hsvToHex(startHue, 1, 1);
      tf.hasExplicitColor = true;
      const effect: RecordedEffect = {
        id: `e-${this.effectCounter++}`,
        effectKey: "position_hue",
        params: { offset_factor: { linear: { start: 0, end: endHue - startHue } } },
      };
      if (phaseValue) effect.phase = phaseValue;
      tf.effects.push(effect);
      return;
    }

    // Normalize effect key aliases (raw addEffect keys like "hue" → "timed_hue")
    const normalizedKey = EFFECT_KEY_ALIASES[effectKey] || effectKey;

    const effect: RecordedEffect = {
      id: `e-${this.effectCounter++}`,
      effectKey: normalizedKey,
    };
    if (params && Object.keys(params).length > 0) effect.params = params;
    if (phaseValue) effect.phase = phaseValue;
    tf.effects.push(effect);
  }

  getResult(songMeta: SongMeta) {
    // Mark timeframes that never received an explicit color
    for (const tf of this.timeframes) {
      if (!tf.hasExplicitColor) tf.hasExplicitColor = false;
    }
    return {
      song: {
        ...songMeta,
        animationType: songMeta.animationType || "song",
      },
      timeframes: this.timeframes,
    };
  }
}

export const recorder = new Recorder();
