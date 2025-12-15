import requests
import time
import curses
import json
import paho.mqtt.client as mqtt

# Replace with actual values
TRIGGER_SERVICE_IP = "10.0.1.200"
TRIGGER_SERVICE_PORT = 8083
MQTT_BROKER = "10.0.1.200"
MQTT_TRIGGER_TOPIC = "trigger"
MQTT_SENSORS_TOPIC = "sensors"
MQTT_BRIGHTNESS_TOPIC = "brightness"
MQTT_BRIGHTNESS_FIELD = "global_brightness"

TRIGGER_URL_BASE = f"http://{TRIGGER_SERVICE_IP}:{TRIGGER_SERVICE_PORT}"

# Trigger cycling configuration
TRIGGER_LIST = ["random", "chill", "party", "psychedelic", "mystery", "background"]
SONG_LIST = ["aladdin", "buttons"]  # Known songs that should not be interrupted
TRIGGER_CYCLE_INTERVAL = 600  # 10 minutes in seconds
current_trigger_index = 0
current_song_index = 0  # Track which song to play next (alternates between 0 and 1)
last_trigger_change = time.time()

# Global variable to store MQTT message
global_trigger_status = ""
trigger_active = False  # Track if the trigger is active
requested_song = ""  # Store the requested song name
motion_sensors = {}  # Store motion sensor data {sensor_name: {"value": value, "alive": bool}}
motion_detected = False  # True if majority of motion sensors are on
brightness = None  # Current brightness value
last_published_brightness = None  # Track last brightness we published
baseline_brightness = None  # Brightness baseline when no motion detected (from MQTT/external for songs)
trigger_baseline_brightness = 0.05  # Baseline brightness for triggers (not songs)
is_playing_trigger = True  # Track if currently playing a trigger (vs song)
stdscr = None  # Global reference to curses screen

def get_current_trigger():
    """Get the current trigger name from the cycling list."""
    global current_trigger_index
    return TRIGGER_LIST[current_trigger_index]

def is_song_playing():
    """Check if the current trigger is a song from our known song list."""
    global global_trigger_status
    # If trigger status is empty or {}, no song is playing
    if not global_trigger_status or global_trigger_status == "{}":
        return False

    # Check if any known song name appears in the trigger status
    for song_name in SONG_LIST:
        if song_name in global_trigger_status.lower():
            return True

    return False

def on_message(client, userdata, msg):
    global global_trigger_status, requested_song, trigger_active, stdscr
    previous_status = global_trigger_status
    global_trigger_status = msg.payload.decode("utf-8").strip()
    # Check if trigger became empty ({}) - if so, send current trigger
    if previous_status != "{}" and global_trigger_status == "{}":
        current_trigger = get_current_trigger()
        if stdscr:
            stdscr.addstr(f"\nTrigger became empty, sending '{current_trigger}' trigger")
            stdscr.refresh()
        trigger(stdscr, current_trigger)

    if (requested_song in global_trigger_status):  # True if the song name is in the payload
        trigger_active = True
    else:
        trigger_active = False

def update_motion_detected():
    """Update motion_detected based on majority vote of motion sensors."""
    global motion_detected, motion_sensors
    if not motion_sensors:
        motion_detected = False
        return

    # Count only alive sensors that are "on"
    alive_sensors = {name: data for name, data in motion_sensors.items() if data.get("alive", False)}

    if not alive_sensors:
        motion_detected = False
        return

    on_count = sum(1 for data in alive_sensors.values() if data.get("value"))
    total_count = len(alive_sensors)

    # Majority vote: more than half must be on
    motion_detected = on_count > (total_count / 2)

def on_sensors_message(client, userdata, msg):
    """Parse sensor JSON messages and store motion sensor values."""
    global motion_sensors, stdscr
    try:
        data = json.loads(msg.payload.decode("utf-8"))
        if "sensor" in data and "value" in data:
            sensor_name = data["sensor"]
            # Check if sensor name starts with "motion"
            if sensor_name.startswith("motion"):
                # Store both value and alive status
                alive_status = data.get("alive", False)
                motion_sensors[sensor_name] = {
                    "value": data["value"],
                    "alive": alive_status
                }
                update_motion_detected()  # Recalculate motion detection
                if stdscr:
                    stdscr.addstr(f"\nMotion sensor '{sensor_name}' = {data['value']} (alive: {alive_status}, detected: {motion_detected})")
                    stdscr.refresh()
    except json.JSONDecodeError as e:
        if stdscr:
            stdscr.addstr(f"\nFailed to parse sensor JSON: {e}")
            stdscr.refresh()
    except Exception as e:
        if stdscr:
            stdscr.addstr(f"\nError processing sensor: {e}")
            stdscr.refresh()

def on_brightness_message(client, userdata, msg):
    """Handle incoming brightness MQTT messages."""
    global brightness, last_published_brightness, baseline_brightness, stdscr
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_brightness = float(payload.get(MQTT_BRIGHTNESS_FIELD, 0.0))

        # Check if this is an external change (not from us)
        if last_published_brightness is not None and abs(new_brightness - last_published_brightness) > 0.01:
            # External change detected - update baseline to respect this change
            baseline_brightness = new_brightness
            if stdscr:
                stdscr.addstr(f"\nExternal brightness change detected: {new_brightness}, updating baseline")
                stdscr.refresh()

        brightness = new_brightness
    except (json.JSONDecodeError, ValueError):
        brightness = 0.0

client = mqtt.Client()

def is_mqtt_available():
    """Check if the MQTT broker inside Docker is running."""
    try:
        client.connect(MQTT_BROKER, 1883, 3)  # Timeout after 3 seconds
        client.disconnect()
        return True
    except:
        return False

def get_latest_brightness():
    """Get the latest retained brightness from MQTT."""
    global brightness
    brightness = None

    client.unsubscribe(MQTT_BRIGHTNESS_TOPIC)
    client.subscribe(MQTT_BRIGHTNESS_TOPIC)

    for _ in range(10):
        if brightness is not None:
            return
        time.sleep(0.1)

    if brightness is None:
        brightness = 0.5

def publish_brightness():
    """Publish current brightness to MQTT."""
    global last_published_brightness
    updated_payload = json.dumps({MQTT_BRIGHTNESS_FIELD: brightness})
    client.publish(MQTT_BRIGHTNESS_TOPIC, updated_payload, retain=True)
    last_published_brightness = brightness  # Track what we published

def setup_mqtt():
    client.on_message = on_message
    client.connect(MQTT_BROKER)
    client.subscribe(MQTT_TRIGGER_TOPIC)
    # Subscribe to sensors topic with dedicated callback (using wildcard for all thing names)
    client.message_callback_add("sensors/#", on_sensors_message)
    client.subscribe("sensors/#")
    # Subscribe to brightness topic with dedicated callback
    client.message_callback_add(MQTT_BRIGHTNESS_TOPIC, on_brightness_message)
    client.subscribe(MQTT_BRIGHTNESS_TOPIC)
    client.loop_start()

def stop(stdscr):
    """Send a request to stop the trigger."""
    try:
        res = requests.post(f"{TRIGGER_URL_BASE}/stop", timeout=1)
        stdscr.addstr(f"\nTrigger stopped, HTTP status: {res.status_code}")
        stdscr.refresh()
    except requests.RequestException as err:
        stdscr.addstr(f"\nError while stopping trigger: {err}")
        stdscr.refresh()

def start_song(stdscr, song_name: str, start_offset_seconds: float = 0):
    """Start a song with an optional start offset in seconds."""
    global requested_song, is_playing_trigger, brightness, baseline_brightness
    requested_song = song_name  # Set the requested song global so we can check if it's playing
    is_playing_trigger = False  # Mark that we're playing a song, not a trigger

    # When starting a song, restore brightness to baseline (from MQTT/external)
    if baseline_brightness is not None:
        brightness = baseline_brightness
        publish_brightness()
        stdscr.addstr(f"\nRestoring brightness to baseline {baseline_brightness} for song")
        stdscr.refresh()

    try:
        res = requests.post(
            f"{TRIGGER_URL_BASE}/song/{song_name}/play",
            json={"start_offset_ms": int(start_offset_seconds * 1000)},
            timeout=1
        )
        stdscr.addstr(f"\nSong {song_name} started, HTTP status: {res.status_code}")
        stdscr.refresh()
    except requests.RequestException as err:
        stdscr.addstr(f"\nError while starting song '{song_name}': {err}")
        stdscr.refresh()

def trigger(stdscr, trigger_name: str):
    """Send a trigger request."""
    global is_playing_trigger, brightness, trigger_baseline_brightness
    is_playing_trigger = True  # Mark that we're playing a trigger

    # When starting a trigger, set brightness to trigger baseline (0.05)
    brightness = trigger_baseline_brightness
    publish_brightness()
    stdscr.addstr(f"\nSetting brightness to trigger baseline {trigger_baseline_brightness}")
    stdscr.refresh()

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
    global trigger_active, stdscr, brightness, current_trigger_index, current_song_index, last_trigger_change, baseline_brightness
    stdscr = screen  # Make stdscr available globally
    last_brightness_update = time.time()
    last_trigger_change = time.time()  # Track when we last changed the trigger
    previous_motion_state = False  # Track motion state changes
    is_decreasing_brightness = False  # Flag to disable motion detection during brightness decrease

    # Setup the screen
    stdscr.nodelay(True)
    stdscr.clear()
    stdscr.scrollok(True)  # Allow scrolling

    setup_mqtt()

    # Initialize brightness to 0.2
    get_latest_brightness()
    if brightness is None:
        brightness = 0.2
    baseline_brightness = brightness  # Set initial baseline
    publish_brightness()
    stdscr.addstr(f"Initial brightness set to {brightness}\n")
    stdscr.refresh()

    current_trigger = get_current_trigger()
    while not trigger(stdscr, current_trigger):  # Send the current trigger until successful
        time.sleep(5)
    time.sleep(1)  # wait for the trigger to get to the rings
    trigger(stdscr, current_trigger)  # Send it again to make sure they all got it

    stdscr.addstr(f"\nMotion-based brightness control active. Starting with '{current_trigger}' trigger.\n")
    stdscr.addstr(f"Triggers will cycle every {TRIGGER_CYCLE_INTERVAL // 60} minutes.\n")
    stdscr.refresh()
    while True:
        key = stdscr.getch()
        current_time = time.time()

        # Check if it's time to cycle to the next trigger
        if current_time - last_trigger_change >= TRIGGER_CYCLE_INTERVAL:
            # Don't interrupt if a song is currently playing
            if is_song_playing():
                stdscr.addstr(f"\nSong is playing, skipping trigger cycle")
                stdscr.refresh()
                # Reset timer to check again in the next interval
                last_trigger_change = current_time
            else:
                # Change to next trigger
                current_trigger_index = (current_trigger_index + 1) % len(TRIGGER_LIST)
                current_trigger = get_current_trigger()
                stdscr.addstr(f"\n--- Cycling to trigger: {current_trigger} ---")
                stdscr.refresh()
                trigger(stdscr, current_trigger)

                # Wait for trigger to complete, then play alternating song
                time.sleep(2)
                song_to_play = SONG_LIST[current_song_index]
                stdscr.addstr(f"\n--- Playing song: {song_to_play} ---")
                stdscr.refresh()
                start_song(stdscr, song_to_play)

                # Alternate to next song for next cycle
                current_song_index = (current_song_index + 1) % len(SONG_LIST)
                last_trigger_change = current_time

        # Handle brightness based on motion detection
        # - For songs: brightness stays at baseline (from MQTT/external)
        # - For triggers: motion controls brightness (0.05 baseline -> 1.0 with motion)
        if current_time - last_brightness_update >= 0.25:  # Adjust every 0.25 seconds
            if is_song_playing():
                # During songs, keep brightness at baseline (from MQTT/external)
                if baseline_brightness is not None and brightness != baseline_brightness:
                    brightness = baseline_brightness
                    publish_brightness()
                    stdscr.addstr(f"\nSong playing - maintaining baseline brightness: {brightness}")
                    stdscr.refresh()
            elif is_playing_trigger:
                # For triggers, motion controls brightness
                current_baseline = trigger_baseline_brightness

                # Detect motion state change (only if not currently decreasing brightness)
                if not is_decreasing_brightness and motion_detected and not previous_motion_state:
                    # Motion just started
                    stdscr.addstr(f"\nMotion started - will increase from {current_baseline} to 1.0")
                    stdscr.refresh()

                if not is_decreasing_brightness and motion_detected:
                    # Increase brightness gradually to 1.0
                    target_brightness = 1.0
                    if brightness < target_brightness:
                        brightness = min(target_brightness, round(brightness + 0.1, 1))
                        publish_brightness()
                        stdscr.addstr(f"\nMotion detected - brightness: {brightness}")
                        stdscr.refresh()
                    previous_motion_state = motion_detected
                elif not motion_detected or is_decreasing_brightness:
                    # Return brightness to trigger baseline (0.05)
                    if brightness > current_baseline:
                        if not is_decreasing_brightness:
                            stdscr.addstr(f"\nStarting brightness decrease to {current_baseline} (motion detection disabled)")
                            stdscr.refresh()
                        is_decreasing_brightness = True
                        brightness = max(current_baseline, round(brightness - 0.1, 1))
                        publish_brightness()
                        stdscr.addstr(f"\nNo motion - brightness: {brightness}")
                        stdscr.refresh()

                        # Check if we've reached baseline
                        if brightness <= current_baseline:
                            is_decreasing_brightness = False
                            stdscr.addstr(f"\nBrightness decrease complete (motion detection enabled)")
                            stdscr.refresh()
                    else:
                        # Not decreasing, just update state
                        previous_motion_state = motion_detected

            last_brightness_update = current_time

        time.sleep(0.01)

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
