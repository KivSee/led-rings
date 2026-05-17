import mqtt from "mqtt";
import * as dotenv from "dotenv";
dotenv.config();

const brokerIp = process.env.MQTT_BROKER;
if (!brokerIp) {
    console.error("MQTT_BROKER not set in .env");
    process.exit(1);
}

const client = mqtt.connect(`mqtt://${brokerIp}`, { connectTimeout: 4000 });

client.on("connect", () => {
    const payload = JSON.stringify({ trigger_name: "clock" });
    client.publish("trigger", payload, { retain: true, qos: 1 }, (err) => {
        if (err) console.error("publish error:", err.message);
        else console.log("Published clock trigger to MQTT");
        client.end();
    });
});

client.on("error", (err) => {
    console.error("MQTT error:", err.message);
    process.exit(1);
});
