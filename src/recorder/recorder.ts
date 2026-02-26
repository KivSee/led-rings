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

    // Reconstruct cycle info
    const cycles: CycleInfo[] = [];
    if (effectConfig.repeat_num != null && effectConfig.repeat_num > 0) {
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
      return;
    }

    const effect: RecordedEffect = {
      id: `e-${this.effectCounter++}`,
      effectKey,
    };
    if (params && Object.keys(params).length > 0) effect.params = params;
    if (phaseValue) effect.phase = phaseValue;
    tf.effects.push(effect);
  }

  getResult(songMeta: SongMeta) {
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
