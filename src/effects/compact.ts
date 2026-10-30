import { Effect } from "./types";

/** Count every nested JSON container, including effect/config wrappers. */
export function nestingDepth(value: unknown): number {
  return value && typeof value === "object"
    ? 1 + Math.max(0, ...Object.values(value).map(nestingDepth)) : 0;
}

const functionKinds = new Set(["const_value", "linear", "sin", "steps", "repeat", "half", "comb2", "fixed_window", "moving_window"]);

/** Each node costs a controller allocation, even if the effect count is small. */
export function functionCount(value: unknown): number {
  return value && typeof value === "object" ? Object.entries(value).reduce((total, [key, child]) =>
    total + Number(functionKinds.has(key)) + functionCount(child), 0) : 0;
}

/** Normalize the legacy spelling before checking/exporting controller effects. */
export function compactEffects(effects: Effect[]): Effect[] {
  return effects.map(effect => (effect as any).constColor
    ? { effect_config: effect.effect_config, const_color: (effect as any).constColor }
    : effect);
}
