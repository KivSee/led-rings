// PUT a sequence to led-sequence-service and POST a trigger so the Lilum
// pendant lights up: inner -> middle -> outer, each fading in and out
// in sequence, each ring its own colour. Loops with `num_repeats: 0`.

import axios from "axios";
import {
    SEQUENCE_SERVICE_IP, SEQUENCE_SERVICE_PORT,
    TRIGGER_SERVICE_IP,  TRIGGER_SERVICE_PORT,
} from "../sys-config/sys-config";

const THING_NAME    = "lilum";
const TRIGGER_NAME  = "lilum";

const FADE_MS    = 1500;          // fade-in + fade-out per ring
const GAP_MS     = 200;           // overlap is negative; positive = gap
const RING_COUNT = 3;

// hue 0..1 (red, green, blue-ish)
const RING_HUES = { inner: 0.00, middle: 0.33, outer: 0.66 } as const;

interface Effect {
    effect_config: { start_time: number; end_time: number; segments: string };
    const_color?:       { color: { hue: number; sat: number; val: number } };
    timed_brightness?:  { mult_factor_decrease: { half: { f1: { linear: { start: number; end: number } }; f2: { linear: { start: number; end: number } } } } };
}

const fadeInOutPair = (segment: string, hue: number, start: number, end: number): Effect[] => {
    const cfg = { start_time: start, end_time: end, segments: segment };
    return [
        { effect_config: cfg, const_color: { color: { hue, sat: 1.0, val: 1.0 } } },
        { effect_config: cfg, timed_brightness: { mult_factor_decrease: { half: {
            f1: { linear: { start: 0.0, end: 1.0 } },
            f2: { linear: { start: 1.0, end: 0.0 } },
        } } } },
    ];
};

const buildSequence = () => {
    const effects: Effect[] = [];
    const stride = FADE_MS + GAP_MS;

    let t = 0;
    effects.push(...fadeInOutPair("inner",  RING_HUES.inner,  t, t + FADE_MS));
    t += stride;
    effects.push(...fadeInOutPair("middle", RING_HUES.middle, t, t + FADE_MS));
    t += stride;
    effects.push(...fadeInOutPair("outer",  RING_HUES.outer,  t, t + FADE_MS));
    t += FADE_MS;   // total duration ends with last fade-out

    return {
        [THING_NAME]: {
            effects,
            duration_ms: t,
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
