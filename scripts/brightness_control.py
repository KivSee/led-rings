import paho.mqtt.client as mqtt
import json
import curses
import time

# MQTT settings
MQTT_BROKER = "localhost"
MQTT_TOPIC = "brightness"
MQTT_FIELD = "global_brightness"

# Global variables
brightness = None
last_input_time = time.monotonic()  # Tracks last valid key press
last_brightness_update = last_input_time  # Tracks last auto-dim step

# Function to handle incoming MQTT messages
def on_message(client, userdata, msg):
    global brightness
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        brightness = float(payload.get(MQTT_FIELD, 0.0))  # Default to 0.0 if missing
    except (json.JSONDecodeError, ValueError):
        brightness = 0.0  # Fallback value

# MQTT client setup
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)  # Use latest API

def is_mqtt_available():
    """Check if the MQTT broker inside Docker is running."""
    try:
        client.connect(MQTT_BROKER, 1883, 3)  # Timeout after 3 seconds
        client.disconnect()
        return True
    except:
        return False

# Wait for MQTT server to start
while not is_mqtt_available():
    print("Waiting for MQTT broker (Docker) to start...")
    time.sleep(2)

print("MQTT broker is up! Starting script...")

client.on_message = on_message
client.connect(MQTT_BROKER)
client.loop_start()
client.subscribe(MQTT_TOPIC)  # Subscribe initially

# Function to get the latest retained brightness
def get_latest_brightness():
    global brightness
    brightness = None

    client.unsubscribe(MQTT_TOPIC)
    client.subscribe(MQTT_TOPIC)

    for _ in range(10):
        if brightness is not None:
            return
        time.sleep(0.1)

    if brightness is None:
        brightness = 0.5

# Function to publish brightness
def publish_brightness():
    updated_payload = json.dumps({MQTT_FIELD: brightness})
    client.publish(MQTT_TOPIC, updated_payload, retain=True)

# Function to listen for keypresses and handle brightness changes
def main(stdscr):
    global brightness, last_input_time, last_brightness_update

    stdscr.nodelay(True)  # Makes getch() non-blocking
    stdscr.clear()
    stdscr.scrollok(True)  # Allow scrolling
    stdscr.addstr("Rings automation brightness control\n")
    stdscr.addstr("Pressing SPACE increases brightness\n")

    get_latest_brightness()
    publish_brightness()

    while True:
        key = stdscr.getch()
        current_time = time.monotonic()  # Use monotonic time to avoid clock changes affecting timing

        # Space key press handling (prevents spamming)
        if key == ord(' '):
            if current_time - last_input_time >= 0.5:  # Only process input every 2 seconds
                get_latest_brightness()

                if brightness < 1.0:
                    brightness = round(brightness + 0.2, 1)
                    publish_brightness()
                    stdscr.addstr(f"\nUpdated brightness to {brightness}")
                    stdscr.refresh()

                last_input_time = time.monotonic()  # Reset input timer

        # Auto-dimming if inactive for 5 seconds
        if current_time - last_input_time >= 0.5 and current_time - last_brightness_update >= 0.5:
            get_latest_brightness()

            if brightness > 0.0:
                brightness = round(brightness - 0.2, 1)
                publish_brightness()
                stdscr.addstr(f"\nAuto-dimming: brightness now {brightness}")
                stdscr.refresh()

            last_brightness_update = time.monotonic()  # Reset auto-dim timer

        time.sleep(0.01)  # Avoid CPU overuse

# Run the script with curses
if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except KeyboardInterrupt:
        print("\nExiting program...")
        client.loop_stop()  # Stop the MQTT loop
        client.disconnect()  # Disconnect from the MQTT broker
    except Exception as e:
        print(f"Unhandled exception: {e}")
        client.loop_stop()
        client.disconnect()
        exit(1)  # Exit with a non-zero status code to indicate failure
