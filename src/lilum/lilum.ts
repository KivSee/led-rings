// PUT a sequence to led-sequence-service and POST a trigger so the Lilum
// pendant plays a snake pattern: all 3 rings simultaneously, each with
// its own colour and evenly phase-offset by 1/3 of the cycle.

import axios from "axios";
import {
    SEQUENCE_SERVICE_IP, SEQUENCE_SERVICE_PORT,
    TRIGGER_SERVICE_IP,  TRIGGER_SERVICE_PORT,
} from "../sys-config/sys-config";

const THING_NAME   = "lilum";
const TRIGGER_NAME = "lilum";

const CYCLE_MS    = 5000;   // one full rotation around a ring
const TAIL_LENGTH = 0.6;    // fraction of ring lit as tail (~5 of 9 LEDs)

const RING_CONFIGS = [
    { segment: "inner",  hue: 0.00, phase: 0.00 },
    { segment: "middle", hue: 0.33, phase: 0.33 },
    { segment: "outer",  hue: 0.67, phase: 0.67 },
] as const;

interface Effect {
    effect_config: { start_time: number; end_time: number; segments: string };
    const_color?: { color: { hue: number; sat: number; val: number } };
    snake?: {
        head: { linear: { start: number; end: number } };
        tail_length: { const_value: { value: number } };
        cyclic: boolean;
    };
}

const snakePair = (segment: string, hue: number, phase: number): Effect[] => {
    const cfg = { start_time: 0, end_time: CYCLE_MS, segments: segment };
    return [
        { effect_config: cfg, const_color: { color: { hue, sat: 1.0, val: 1.0 } } },
        {
            effect_config: cfg,
            snake: {
                head: { linear: { start: phase, end: phase + 1.0 } },
                tail_length: { const_value: { value: TAIL_LENGTH } },
                cyclic: true,
            },
        },
    ];
};

const buildSequence = () => {
    const effects: Effect[] = [];
    for (const { segment, hue, phase } of RING_CONFIGS) {
        effects.push(...snakePair(segment, hue, phase));
    }
    return {
        [THING_NAME]: {
            effects,
            duration_ms: CYCLE_MS,
            num_repeats: 0,    // 0 = loop forever
        },
    };
};

(async () => {
    const seqUrl     = `http://${SEQUENCE_SERVICE_IP}:${SEQUENCE_SERVICE_PORT}/triggers/${TRIGGER_NAME}`;
    const triggerUrl = `http://${TRIGGER_SERVICE_IP}:${TRIGGER_SERVICE_PORT}/trigger/${TRIGGER_NAME}`;
    try {
        const seqRes = await axios.put(seqUrl, buildSequence(), { timeout: 5000 });
        console.log(`Sequence "${TRIGGER_NAME}" sent -> ${seqUrl}, status: ${seqRes.status}`);

        const trigRes = await axios.post(triggerUrl, { start_offset_ms: 0 }, { timeout: 5000 });
        console.log(`Trigger "${TRIGGER_NAME}" fired -> ${triggerUrl}, status: ${trigRes.status}`);
    } catch (err) {
        console.error("Error sending Lilum trigger:", err);
        process.exit(1);
    }
})();
