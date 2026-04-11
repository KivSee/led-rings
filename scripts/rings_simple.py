import requests
import time
import curses
import json  # used for brightness MQTT parsing
import paho.mqtt.client as mqtt

# Replace with actual values
TRIGGER_SERVICE_IP = "localhost"
TRIGGER_SERVICE_PORT = 8083
MQTT_BROKER = "localhost"
MQTT_TRIGGER_TOPIC = "trigger"
MQTT_BRIGHTNESS_TOPIC = "brightness"
MQTT_BRIGHTNESS_FIELD = "global_brightness"
MQTT_MANUAL_BRIGHTNESS_TOPIC = "manual_brightness"
MQTT_MANUAL_BRIGHTNESS_FIELD = "global_brightness"

TRIGGER_URL_BASE = f"http://{TRIGGER_SERVICE_IP}:{TRIGGER_SERVICE_PORT}"

# Trigger cycling configuration
TRIGGER_LIST = ["psychedelic", "mystery", "random", "chill", "party", "background"]
TRIGGER_CYCLE_INTERVAL = 450  # 7.5 minutes in seconds
current_trigger_index = 0
last_trigger_change = time.time()

# Global state
global_trigger_status = ""
brightness = 0.25  # Start at baseline, updated by MQTT
brightness_received = False  # Whether we got a retained value from MQTT
manual_brightness_received = False  # Whether we got a retained manual_brightness from MQTT
stdscr = None  # Global reference to curses screen


def get_current_trigger():
    """Get the current trigger name from the cycling list."""
    global current_trigger_index
    return TRIGGER_LIST[current_trigger_index]


def on_message(client, userdata, msg):
    """Handle trigger status messages."""
    global global_trigger_status
    global_trigger_status = msg.payload.decode("utf-8").strip()


def on_brightness_message(client, userdata, msg):
    """Handle incoming brightness MQTT messages — just track the value, don't republish."""
    global brightness, brightness_received, stdscr
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_brightness = float(payload.get(MQTT_BRIGHTNESS_FIELD, 0.0))
        brightness = new_brightness
        brightness_received = True
        if stdscr:
            stdscr.addstr(f"\nBrightness updated from MQTT: {brightness}")
            stdscr.refresh()
    except (json.JSONDecodeError, ValueError):
        pass


def on_manual_brightness_message(client, userdata, msg):
    """Handle incoming manual brightness MQTT messages — update brightness accordingly."""
    global brightness, manual_brightness_received, stdscr
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_manual_brightness = float(payload.get(MQTT_MANUAL_BRIGHTNESS_FIELD, 0.0))
        manual_brightness_received = True
        brightness = new_manual_brightness
        publish_brightness()
        if stdscr:
            stdscr.addstr(f"\nManual brightness changed to {new_manual_brightness}, updating brightness")
            stdscr.refresh()
    except (json.JSONDecodeError, ValueError) as e:
        if stdscr:
            stdscr.addstr(f"\nFailed to parse manual brightness: {e}")
            stdscr.refresh()


client = mqtt.Client()


def is_mqtt_available():
    """Check if the MQTT broker is running."""
    try:
        temp_client = mqtt.Client()
        temp_client.connect(MQTT_BROKER, 1883, 3)
        temp_client.disconnect()
        return True
    except:
        return False


def publish_brightness():
    """Publish the current brightness value to MQTT (retained)."""
    payload = json.dumps({MQTT_BRIGHTNESS_FIELD: brightness})
    client.publish(MQTT_BRIGHTNESS_TOPIC, payload, retain=True)


def publish_manual_brightness():
    """Publish the current brightness value as manual_brightness to MQTT (retained)."""
    payload = json.dumps({MQTT_MANUAL_BRIGHTNESS_FIELD: brightness})
    client.publish(MQTT_MANUAL_BRIGHTNESS_TOPIC, payload, retain=True)


def setup_mqtt():
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER)
    client.loop_start()


def on_connect(client, userdata, flags, rc):
    """Subscribe on connect so subscriptions survive reconnects."""
    try:
        if stdscr:
            stdscr.addstr(f"\nConnected to MQTT broker (rc={rc})")
            stdscr.refresh()
    except Exception:
        pass

    client.message_callback_add(MQTT_TRIGGER_TOPIC, on_message)
    client.subscribe(MQTT_TRIGGER_TOPIC)

    client.message_callback_add(MQTT_BRIGHTNESS_TOPIC, on_brightness_message)
    client.subscribe(MQTT_BRIGHTNESS_TOPIC)

    client.message_callback_add(MQTT_MANUAL_BRIGHTNESS_TOPIC, on_manual_brightness_message)
    client.subscribe(MQTT_MANUAL_BRIGHTNESS_TOPIC)


def trigger(stdscr, trigger_name: str):
    """Send a trigger request."""
    try:
        res = requests.post(
            f"{TRIGGER_URL_BASE}/trigger/{trigger_name}",
            timeout=1
        )
        stdscr.addstr(f"\nTrigger {trigger_name} started, HTTP status: {res.status_code}")
        stdscr.refresh()
        return True
    except requests.RequestException as err:
        stdscr.addstr(f"\nError while starting trigger '{trigger_name}': {err}")
        stdscr.refresh()
        return False


# Wait for MQTT server to start
while not is_mqtt_available():
    print("Waiting for MQTT broker (Docker) to start...")
    time.sleep(2)

print("MQTT broker is up! Starting script...")


def main(screen):
    global stdscr, current_trigger_index, last_trigger_change
    stdscr = screen
    last_trigger_change = time.time()

    stdscr.nodelay(True)
    stdscr.clear()
    stdscr.scrollok(True)

    setup_mqtt()

    # Wait briefly for retained values; then set both brightness and manual_brightness
    time.sleep(1)
    publish_brightness()
    publish_manual_brightness()
    stdscr.addstr(f"Brightness and manual_brightness set to {brightness}\n")
    stdscr.addstr(f"Triggers will cycle every {TRIGGER_CYCLE_INTERVAL // 60} minutes.\n")
    stdscr.refresh()

    current_trigger = get_current_trigger()
    while not trigger(stdscr, current_trigger):
        time.sleep(5)
    time.sleep(1)
    trigger(stdscr, current_trigger)  # Send again to ensure all rings receive it

    while True:
        stdscr.getch()  # Drain input
        current_time = time.time()

        if current_time - last_trigger_change >= TRIGGER_CYCLE_INTERVAL:
            current_trigger_index = (current_trigger_index + 1) % len(TRIGGER_LIST)
            current_trigger = get_current_trigger()
            stdscr.addstr(f"\n--- Cycling to trigger: {current_trigger} ---")
            stdscr.refresh()
            trigger(stdscr, current_trigger)
            last_trigger_change = current_time

        time.sleep(0.1)


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except KeyboardInterrupt:
        print("\nExiting program...")
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        print(f"Unhandled exception: {e}")
        client.loop_stop()
        client.disconnect()
        exit(1)
