import { Animation } from "../animation/animation";
import { Effect } from "../effects/types";
import { buildRotationLayer, buildSection, RotationSpec, SectionSpec } from "./sectionLab";

/**
 * Add a Section Lab section to a song: the section marker's spec, built over [fromBeat, toBeat) with the same code
 * the lab previews, appended ring by ring. Generated song files call this for timeframes that carry a labSection.
 */
export const labSection = (anim: Animation, fromBeat: number, toBeat: number, spec: SectionSpec) => {
    const seq = buildSection(spec, fromBeat, toBeat, 60000 / anim.bpm, anim.startOffsetMs);
    for (let ring = 1; ring <= 12; ring++) {
        const thing = seq[`ring${ring}`];
        if (thing) anim.addRawEffects(ring, thing.effects as unknown as Effect[]);
    }
};

/**
 * Add one layer of a rotation section ('color' or 'modifiers'). Generated song files call this inside the color and
 * modifier blocks at the marker's place, so the rotation sits in the song's layer order like timeframes do.
 */
export const sectionLayer = (anim: Animation, fromBeat: number, toBeat: number, spec: RotationSpec, layer: "color" | "modifiers") => {
    const seq = buildRotationLayer(spec, fromBeat, toBeat, 60000 / anim.bpm, anim.startOffsetMs, layer);
    for (let ring = 1; ring <= 12; ring++) {
        const thing = seq[`ring${ring}`];
        if (thing) anim.addRawEffects(ring, thing.effects as unknown as Effect[]);
    }
};
