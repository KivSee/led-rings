require('dotenv').config();
import env from 'env-var';

export const LEDS_OBJECT_SERVICE_IP = env.get('LEDS_OBJECT_SERVICE_IP').required().asString();
export const LEDS_OBJECT_SERVICE_PORT = env.get('LEDS_OBJECT_SERVICE_PORT').default(8081).asPortNumber();
