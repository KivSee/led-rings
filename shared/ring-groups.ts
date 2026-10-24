/**
 * Named ring groups — shared source of truth.
 *
 * Two consumers need these, and they need them in different forms:
 *
 *  - The runtime (`src/objects/ring-elements.ts`) re-exports each group as a
 *    plain array, because generated song code calls `elements(all, ...)` and the
 *    animation layer resolves those numbers to `ring${n}` things.
 *  - The UI code generator (`ui/src/generateSequenceTs.ts`) needs the group
 *    *names* as strings, so a timeframe whose rings match a group can be emitted
 *    as `elements(all, ...)` instead of a literal `[0, 1, 2, ...]` array.
 *
 * Keeping the members here means those two views can never drift. They used to
 * be duplicated, and a mismatch failed silently: the generator simply stopped
 * recognising the group and emitted a literal array instead.
 *
 * Ring numbers are the device index — group member `n` maps to the thing
 * `ring${n}`, with no offset applied anywhere in the pipeline. The fleet is
 * 1-indexed (ring1..ring12) — there is no ring0.
 */

export const RING_GROUPS = {
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  odd: [1, 3, 5, 7, 9, 11],
  even: [2, 4, 6, 8, 10, 12],
  // Physical halves of the installation (ring 12 hangs just right of the top,
  // see ui/src/ringLayout.ts). Kept in ascending order: phase() offsets follow
  // element order, and the preview/generator count rings ascending.
  left: [6, 7, 8, 9, 10, 11],
  right: [1, 2, 3, 4, 5, 12],
  top: [1, 2, 9, 10, 11, 12],
  bottom: [3, 4, 5, 6, 7, 8],
  b1: [1, 4, 7, 10],
  b2: [2, 3, 5, 6, 8, 9, 11, 12],
} as const

export type RingGroupName = keyof typeof RING_GROUPS

/** Group names in match priority order. `all` first so a full selection prefers it. */
export const RING_GROUP_NAMES = Object.keys(RING_GROUPS) as RingGroupName[]

/** Order-insensitive membership comparison. */
export function sameRings(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

/** The group name whose members exactly match `rings`, or undefined if none does. */
export function ringGroupName(rings: readonly number[]): RingGroupName | undefined {
  return RING_GROUP_NAMES.find((name) => sameRings(rings, RING_GROUPS[name]))
}
