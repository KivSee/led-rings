import axios from "axios";
import { LEDS_OBJECT_SERVICE_IP, LEDS_OBJECT_SERVICE_PORT, NUMBER_OF_RINGS } from "../sys-config/sys-config";

const OBJECT_SERVICE_URL = `http://${LEDS_OBJECT_SERVICE_IP}:${LEDS_OBJECT_SERVICE_PORT}`;

// Spare rings that can be placed at any position (led-sequence-service placement).
// All rings share one segment map, so the spares need it too: an outdated map makes
// a ring fail to decode any sequence using a newer segment and stay dark.
const SPARE_RINGS = [13, 14, 15];

const syncOneRing = async (ringIndex: number) => {

    try {
        const segments = require('./segments.json');
        const res = await axios.put(`${OBJECT_SERVICE_URL}/thing/ring${ringIndex}`, segments, {
            timeout: 1000
        });
        console.log(`Ring ${ringIndex} synced, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while syncing segments');
        console.error(err);
    }
};

/** ring<N> (N >= 1) things the object service already knows, e.g. spares added later. */
const knownRings = async (): Promise<number[]> => {
    try {
        const res = await axios.get(`${OBJECT_SERVICE_URL}/thing`, { timeout: 3000 });
        return Object.keys(res.data)
            .map((name) => /^ring([1-9]\d*)$/.exec(name))
            .filter((m): m is RegExpExecArray => m !== null)
            .map((m) => Number(m[1]));
    } catch (err) {
        console.log('Could not list known rings, syncing the fixed list only');
        return [];
    }
};

(async () => {
    const rings = new Set<number>();
    for (let i = 1; i <= NUMBER_OF_RINGS; i++) rings.add(i);
    SPARE_RINGS.forEach((i) => rings.add(i));
    (await knownRings()).forEach((i) => rings.add(i));
    const sorted = [...rings].sort((a, b) => a - b);
    for (const i of sorted) {
        await syncOneRing(i);
    }
    console.log(`Synced ${sorted.length} rings: ${sorted.join(', ')}`);
})();
