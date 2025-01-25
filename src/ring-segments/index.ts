import axios from "axios";
import { numberOfRings } from "./config";

const syncOneRing = async (ringIndex: number) => {

    try {
        const segments = require('./segments.json');
        const res = await axios.put(`http://10.0.0.49:8081/thing/ring${ringIndex}`, segments, {
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
