import paho.mqtt.client as mqtt
import json
import curses
import time

# MQTT settings
MQTT_BROKER = "localhost"
MQTT_BRIGHTNESS_TOPIC = "brightness"
MQTT_MANUAL_BRIGHTNESS_TOPIC = "manual_brightness"
MQTT_FIELD = "global_brightness"

# Behaviour
DEFAULT_BRIGHTNESS = 0.25
STEP = 0.2
SPACE_DEBOUNCE_S = 0.5
DIM_DELAY_S = 5.0
DIM_STEP_INTERVAL_S = 0.5
RETAINED_WAIT_S = 1.0

# State (all writes go through the helpers below — keeps the rules in one place)
brightness = DEFAULT_BRIGHTNESS  # current value pushed to LEDs
base_brightness = DEFAULT_BRIGHTNESS  # level to dim back down to
should_auto_dim = False  # True only while a SPACE-driven boost is decaying
last_space_press = 0.0  # monotonic time of last accepted SPACE press
last_dim_step = 0.0  # monotonic time of last dim step
retained_received = False  # set True after the broker sends us the retained brightness

stdscr_ref = None


def clamp(v: float) -> float:
    return max(0.0, min(1.0, round(v, 2)))


def log(msg: str) -> None:
    if stdscr_ref:
        stdscr_ref.addstr(f"\n{msg}")
        stdscr_ref.refresh()


def publish_brightness() -> None:
    payload = json.dumps({MQTT_FIELD: brightness})
    client.publish(MQTT_BRIGHTNESS_TOPIC, payload, retain=True)


def publish_manual_brightness() -> None:
    payload = json.dumps({MQTT_FIELD: brightness})
    client.publish(MQTT_MANUAL_BRIGHTNESS_TOPIC, payload, retain=True)


def on_brightness_message(client, userdata, msg):
    """Brightness topic — used only to discover the retained value at startup."""
    global brightness, base_brightness, retained_received
    if retained_received:
        return  # we own this topic after startup; ignore further echoes
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        value = clamp(float(payload.get(MQTT_FIELD, DEFAULT_BRIGHTNESS)))
        brightness = value
        base_brightness = value
        retained_received = True
        log(f"Adopted retained brightness {value}")
    except (json.JSONDecodeError, ValueError):
        pass


def on_manual_brightness_message(client, userdata, msg):
    """External manual-brightness change — adopt as new base, disable auto-dim."""
    global brightness, base_brightness, should_auto_dim
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_value = clamp(float(payload.get(MQTT_FIELD, 0.0)))
    except (json.JSONDecodeError, ValueError):
        return

    # Ignore our own retained echoes
    if new_value == brightness:
        return

    brightness = new_value
    base_brightness = new_value
    should_auto_dim = False
    publish_brightness()
    log(f"External change → base={base_brightness}, auto-dim off")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)


def wait_for_broker() -> None:
    while True:
        try:
            client.connect(MQTT_BROKER, 1883, 3)
            client.disconnect()
            return
        except Exception:
            print("Waiting for MQTT broker to start...")
            time.sleep(2)


wait_for_broker()
print("MQTT broker is up! Starting script...")

client.message_callback_add(MQTT_BRIGHTNESS_TOPIC, on_brightness_message)
client.message_callback_add(MQTT_MANUAL_BRIGHTNESS_TOPIC, on_manual_brightness_message)
client.connect(MQTT_BROKER)
client.loop_start()
client.subscribe(MQTT_BRIGHTNESS_TOPIC)
client.subscribe(MQTT_MANUAL_BRIGHTNESS_TOPIC)


def main(stdscr):
    global brightness, base_brightness, should_auto_dim
    global last_space_press, last_dim_step, retained_received, stdscr_ref
    stdscr_ref = stdscr

    stdscr.nodelay(True)
    stdscr.clear()
    stdscr.scrollok(True)
    stdscr.addstr("Rings automation brightness control\n")
    stdscr.addstr("Press SPACE to increase brightness; auto-dims back after 5s of inactivity\n")

    # Give the broker a moment to deliver the retained brightness before publishing our default
    deadline = time.monotonic() + RETAINED_WAIT_S
    while not retained_received and time.monotonic() < deadline:
        time.sleep(0.05)

    if not retained_received:
        log(f"No retained brightness — using default {DEFAULT_BRIGHTNESS}")
        publish_brightness()

    log(f"Brightness {brightness}, base {base_brightness}")

    while True:
        key = stdscr.getch()
        now = time.monotonic()

        if key == ord(' ') and now - last_space_press >= SPACE_DEBOUNCE_S:
            if brightness < 1.0:
                brightness = clamp(brightness + STEP)
                publish_brightness()
                publish_manual_brightness()
                log(f"SPACE → brightness {brightness} (base {base_brightness})")
            last_space_press = now
            last_dim_step = now
            should_auto_dim = brightness > base_brightness

        if (should_auto_dim
                and now - last_space_press >= DIM_DELAY_S
                and now - last_dim_step >= DIM_STEP_INTERVAL_S):
            next_value = clamp(brightness - STEP)
            if next_value < base_brightness:
                next_value = base_brightness
            brightness = next_value
            publish_brightness()
            publish_manual_brightness()
            log(f"Auto-dim → brightness {brightness}")
            last_dim_step = now
            if brightness <= base_brightness:
                should_auto_dim = False

        time.sleep(0.01)


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except KeyboardInterrupt:
        print("\nExiting program...")
    except Exception as e:
        print(f"Unhandled exception: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
