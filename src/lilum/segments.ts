// Push the Lilum object's segment definitions to led-object-service.
// Lilum thing has 27 animation pixels in 3 concentric rings of 9. Data line
// starts at the outer ring (verified empirically with yarn lilum-diag):
//   outer  = indices 0..8
//   middle = indices 9..17
//   inner  = indices 18..26
// Pixel 0 of the physical strip is a status LED and is NOT part of these
// indices (the firmware already strips it before exposing the buffer).

import axios from "axios";
import { LEDS_OBJECT_SERVICE_IP, LEDS_OBJECT_SERVICE_PORT } from "../sys-config/sys-config";

// lilum0 is a second pendant with identical hardware/segments to lilum.
const THING_NAMES = ["lilum", "lilum0"];
const NUM_PIXELS = 27;

interface Pixel { index: number; relPos: number; }
interface Segment { name: string; pixels: Pixel[]; }

const ringSegment = (name: string, first: number, last: number): Segment => {
    const span = last - first;
    const pixels: Pixel[] = [];
    for (let i = first; i <= last; i++) {
        pixels.push({ index: i, relPos: span === 0 ? 0 : (i - first) / span });
    }
    return { name, pixels };
};

const allSegment = (): Segment => {
    const pixels: Pixel[] = [];
    for (let i = 0; i < NUM_PIXELS; i++) {
        pixels.push({ index: i, relPos: i / (NUM_PIXELS - 1) });
    }
    return { name: "all", pixels };
};

const payload = {
    numberOfPixels: NUM_PIXELS,
    segments: [
        allSegment(),
        ringSegment("outer",  0,  8),
        ringSegment("middle", 9, 17),
        ringSegment("inner", 18, 26),
    ],
};

(async () => {
    for (const thing of THING_NAMES) {
        const url = `http://${LEDS_OBJECT_SERVICE_IP}:${LEDS_OBJECT_SERVICE_PORT}/thing/${thing}`;
        try {
            const res = await axios.put(url, payload, { timeout: 5000 });
            console.log(`Lilum segments synced -> ${url}, status: ${res.status}`);
        } catch (err) {
            console.error(`Error syncing segments for ${thing}:`, err);
            process.exit(1);
        }
    }
})();
