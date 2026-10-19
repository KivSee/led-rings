// Ring group members live in shared/ring-groups.ts so the UI code generator and
// the runtime cannot drift apart. These re-exports keep the call shape that every
// generated song uses: elements(all, ...), elements(center, ...), and so on.
import { RING_GROUPS } from "../../shared/ring-groups";

export const all = [...RING_GROUPS.all];
export const odd = [...RING_GROUPS.odd];
export const even = [...RING_GROUPS.even];
export const left = [...RING_GROUPS.left];
export const right = [...RING_GROUPS.right];
export const top = [...RING_GROUPS.top];
export const bottom = [...RING_GROUPS.bottom];
export const b1 = [...RING_GROUPS.b1];
export const b2 = [...RING_GROUPS.b2];

export const segment_all = "all";
export const segment_centric = "centric";
export const segment_updown = "updown";
export const segment_arc = "arc";
export const segment_ind = "ind";
export const segment_b1 = "b1";
export const segment_b2 = "b2";
export const segment_rand = "rand";
export const segment_rad = "rad";
