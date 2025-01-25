import axios from "axios";
import { TRIGGER_SERVICE_IP, TRIGGER_SERVICE_PORT } from "../sys-config/sys-config";
import { Sequence } from "../effects/types";
import { ThingName } from "../objects/types";

export type SequencePerThing = Record<ThingName, Sequence>;

const triggerUrlBase = `http://${TRIGGER_SERVICE_IP}:${TRIGGER_SERVICE_PORT}`;

export const stop = async () => {
    try {
        const res = await axios.post(`${triggerUrlBase}/stop`, {
            timeout: 1000
        });
        console.log(`Trigger stopped, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while stopping trigger');
        console.error(err);
    }
};

export const trigger = async (triggerName: string) => {
    try {
        const res = await axios.post(`${triggerUrlBase}/trigger/${triggerName}`, {
            timeout: 1000
        });
        console.log(`Trigger ${triggerName} started, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while starting trigger', { triggerName });
        console.error(err);
    }
};
