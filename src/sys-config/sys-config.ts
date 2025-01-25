require('dotenv').config();
import env from 'env-var';

export const NUMBER_OF_RINGS = env.get('NUMBER_OF_RINGS').default(12).asIntPositive();

export const LEDS_OBJECT_SERVICE_IP = env.get('LEDS_OBJECT_SERVICE_IP').required().asString();
export const LEDS_OBJECT_SERVICE_PORT = env.get('LEDS_OBJECT_SERVICE_PORT').default(8081).asPortNumber();

export const SEQUENCE_SERVICE_IP = env.get('SEQUENCE_SERVICE_IP').required().asString();
export const SEQUENCE_SERVICE_PORT = env.get('SEQUENCE_SERVICE_PORT').default(8082).asPortNumber();

export const TRIGGER_SERVICE_IP = env.get('TRIGGER_SERVICE_IP').required().asString();
export const TRIGGER_SERVICE_PORT = env.get('TRIGGER_SERVICE_PORT').default(8083).asPortNumber();
