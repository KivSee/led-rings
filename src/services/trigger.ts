import axios from "axios";
import { TRIGGER_SERVICE_IP, TRIGGER_SERVICE_PORT } from "../sys-config/sys-config";
import { Sequence, ThingName } from "../effects/types";

export type SequencePerThing = Record<ThingName, Sequence>;

export const startTrigger = async (triggerName: string) => {
    try {
        const res = await axios.post(`http://${TRIGGER_SERVICE_IP}:${TRIGGER_SERVICE_PORT}/trigger/${triggerName}`, {
            timeout: 1000
        });
        console.log(`Trigger ${triggerName} started, http status: ${res.status}`);
    } catch (err) {
        console.log('Error while starting trigger', { triggerName });
        console.error(err);
    }
};
