/**
 * MQTT brightness bridge for the control server.
 * Maintains a persistent connection to the broker, subscribes to the
 * retained "brightness" topic, and exposes get/set helpers used by
 * the control-server HTTP endpoints.
 *
 * Behaviour:
 *  - On first connect, if no retained message arrives within 2 s →
 *    publishes 1.0 with retain=true to initialise the topic.
 *  - Always keeps the last known value so GET /api/brightness responds
 *    instantly without waiting for the broker.
 */
import mqtt from "mqtt";
import * as dotenv from "dotenv";
dotenv.config();

const BROKER_IP = process.env.MQTT_BROKER || "";
const BROKER_URL = BROKER_IP ? `mqtt://${BROKER_IP}` : "";
const TOPIC = "brightness";
const INIT_TIMEOUT_MS = 2000;

let client: mqtt.MqttClient | null = null;
let connected = false;
let currentValue = 1.0;
let receivedRetained = false;

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function publish(value: number) {
  if (!client || !connected) return;
  client.publish(TOPIC, JSON.stringify({ global_brightness: value }), { retain: true, qos: 1 });
}

export function getBrightnessState(): { value: number; connected: boolean } {
  return { value: currentValue, connected };
}

export function setBrightness(value: number): number {
  currentValue = clamp(value);
  publish(currentValue);
  return currentValue;
}

export function initMqttBrightness() {
  if (!BROKER_URL) {
    console.warn("[brightness] MQTT_BROKER not set — brightness MQTT disabled");
    return;
  }

  client = mqtt.connect(BROKER_URL, {
    clientId: `led-rings-control-server-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 5000,
    connectTimeout: 4000,
  });

  client.on("connect", () => {
    connected = true;
    receivedRetained = false;
    console.log(`[brightness] Connected to MQTT broker at ${BROKER_URL}`);

    client!.subscribe(TOPIC, { qos: 1 }, (err) => {
      if (err) {
        console.error("[brightness] Subscribe error:", err.message);
        return;
      }
      // If broker has no retained message, initialise to 1.0 after a short wait
      setTimeout(() => {
        if (!receivedRetained) {
          console.log("[brightness] No retained value found — initialising to 1.0");
          currentValue = 1.0;
          publish(1.0);
        }
      }, INIT_TIMEOUT_MS);
    });
  });

  client.on("message", (_topic: string, payload: Buffer) => {
    try {
      const msg = JSON.parse(payload.toString());
      const raw = parseFloat(msg.global_brightness);
      if (!isNaN(raw)) {
        currentValue = clamp(raw);
        receivedRetained = true;
      }
    } catch {
      // ignore malformed messages
    }
  });

  client.on("offline", () => {
    connected = false;
    console.warn("[brightness] MQTT broker offline");
  });

  client.on("error", (err: Error) => {
    connected = false;
    console.error("[brightness] MQTT error:", err.message);
  });
}
