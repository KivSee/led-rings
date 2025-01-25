import axios from "axios";
import { numberOfRings } from "./config";
import { LEDS_OBJECT_SERVICE_IP, LEDS_OBJECT_SERVICE_PORT } from "../sys-config/sys-config";

const syncOneRing = async (ringIndex: number) => {

    try {
        const segments = require('./segments.json');
        const res = await axios.put(`http://${LEDS_OBJECT_SERVICE_IP}:${LEDS_OBJECT_SERVICE_PORT}/thing/ring${ringIndex}`, segments, {
            timeout: 1000
        });
        console.log(`Ring ${ringIndex} synced, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while syncing segments');
        console.error(err);
    }
};

(async () => {
    for (let i = 0; i < numberOfRings; i++) {
        await syncOneRing(i);
    }
    console.log(`Synced all ${numberOfRings} rings`);
})();
