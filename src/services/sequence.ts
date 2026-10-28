import axios from "axios";
import { SEQUENCE_SERVICE_IP, SEQUENCE_SERVICE_PORT } from "../sys-config/sys-config";
import { Sequence } from "../effects/types";
import { ThingName } from "../objects/types";

export type SequencePerThing = Record<ThingName, Sequence>;

/**
 * The rings decode a sequence recursively, one level per nested message, on a fixed-size stack (32 KB since
 * esp32-animations dc0a4d7; it was 8 KB and inequal's ~5 nested functions overflowed it on ring 10). 20 nested
 * functions stays well inside 32 KB; anything deeper is a generator bug (an unbalanced chain), not a design need.
 */
export const MAX_FUNCTION_DEPTH = 20;
const FLOAT_FUNCTION_KEYS = new Set(["const_value", "linear", "sin", "steps", "repeat", "half", "comb2", "fixed_window", "moving_window"]);

/** Deepest chain of float functions nested inside each other anywhere in `node`. */
export const functionDepth = (node: unknown): number => {
    if (!node || typeof node !== "object") return 0;
    let deepest = 0;
    for (const [key, value] of Object.entries(node)) {
        deepest = Math.max(deepest, (FLOAT_FUNCTION_KEYS.has(key) ? 1 : 0) + functionDepth(value));
    }
    return deepest;
};

/** Throws if any effect nests functions deeper than the rings can decode. */
export const checkFunctionDepth = (triggerName: string, sequencePerThing: SequencePerThing) => {
    for (const [thing, sequence] of Object.entries(sequencePerThing)) {
        sequence.effects.forEach((effect, index) => {
            const depth = functionDepth(effect);
            if (depth > MAX_FUNCTION_DEPTH) {
                throw new Error(`trigger ${triggerName}: ${thing} effect #${index} nests ${depth} float functions ` +
                    `(max ${MAX_FUNCTION_DEPTH}); the rings would overflow their decode stack and reboot`);
            }
        });
    }
};

export const sendSequence = async (triggerName: string, sequencePerThing: SequencePerThing) => {
    checkFunctionDepth(triggerName, sequencePerThing);
    try {
        const res = await axios.put(`http://${SEQUENCE_SERVICE_IP}:${SEQUENCE_SERVICE_PORT}/triggers/${triggerName}`, sequencePerThing, {
            timeout: 10000
        });
        console.log(`Effects for trigger ${triggerName} sent, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while sending effects for trigger', { triggerName });
        console.error(err);
    }
};
