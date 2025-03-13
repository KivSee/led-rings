import axios from "axios";
import { SEQUENCE_SERVICE_IP, SEQUENCE_SERVICE_PORT } from "../sys-config/sys-config";
import { Sequence } from "../effects/types";
import { ThingName } from "../objects/types";

export type SequencePerThing = Record<ThingName, Sequence>;

export const sendSequence = async (triggerName: string, sequencePerThing: SequencePerThing) => {
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
