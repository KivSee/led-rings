import requests
import time
import curses
import json
import paho.mqtt.client as mqtt

# Replace with actual values
TRIGGER_SERVICE_IP = "localhost"
TRIGGER_SERVICE_PORT = 8083
MQTT_BROKER = "localhost"
MQTT_TRIGGER_TOPIC = "trigger"
MQTT_SENSORS_TOPIC = "sensors"
MQTT_RFID_TOPIC = "sensors/rfid"
MQTT_BRIGHTNESS_TOPIC = "brightness"
MQTT_BRIGHTNESS_FIELD = "global_brightness"
MQTT_MANUAL_BRIGHTNESS_TOPIC = "manual_brightness"
MQTT_MANUAL_BRIGHTNESS_FIELD = "global_brightness"

TRIGGER_URL_BASE = f"http://{TRIGGER_SERVICE_IP}:{TRIGGER_SERVICE_PORT}"

# Trigger cycling configuration
TRIGGER_LIST = ["psychedelic", "mystery", "random", "chill", "party", "background"]
SONG_LIST = ["aladdin", "buttons"]  # Known songs that should not be interrupted
TRIGGER_CYCLE_INTERVAL = 450  # 7.5 minutes in seconds
current_trigger_index = 0
current_song_index = 0  # Track which song to play next (alternates between 0 and 1)
last_trigger_change = time.time()

# Global variable to store MQTT message
global_trigger_status = ""
trigger_active = False  # Track if the trigger is active
requested_song = ""  # Store the requested song name
last_rfid_color = ""  # Store last RFID color for agent->song transition
last_rfid_box_id = "box1"  # Store last RFID box_id for agent->song transition
motion_sensors = {}  # Store motion sensor data {sensor_name: {"value": value, "alive": bool}}
motion_detected = False  # True if majority of motion sensors are on
brightness = None  # Current brightness value
last_published_brightness = None  # Track last brightness we published
baseline_brightness = None  # Brightness baseline when no motion detected (from MQTT/external)
manual_brightness = None  # Manual brightness for songs (from manual_brightness topic)
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
    global global_trigger_status, requested_song, trigger_active, stdscr, current_song_index, last_rfid_color, last_rfid_box_id
    previous_status = global_trigger_status
    global_trigger_status = msg.payload.decode("utf-8").strip()

    # Check if trigger became empty ({}) after agent song
    if previous_status != "{}" and global_trigger_status == "{}":
        # Check if the previous trigger was the agent song
        if "agent" in previous_status.lower():
            # Agent song just finished, play the current song from the list
            song_to_play = SONG_LIST[current_song_index]
            if stdscr:
                stdscr.addstr(f"\n--- Agent finished, playing song: {song_to_play} ---")
                stdscr.refresh()

            # Use stored color and box_id from RFID trigger
            start_song(stdscr, song_to_play, color=last_rfid_color, box_id=last_rfid_box_id)

            # Advance to next song for next RFID trigger
            current_song_index = (current_song_index + 1) % len(SONG_LIST)
        else:
            # Normal trigger end, send current trigger
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

def on_rfid_message(client, userdata, msg):
    """Handle RFID sensor messages and play songs when chip is detected."""
    global current_song_index, stdscr, is_playing_audio, last_rfid_color, last_rfid_box_id
    try:
        # Check if this is a chip topic (sensors/rfid/box#/chip)
        topic = msg.topic
        if "/chip" in topic:
            data = json.loads(msg.payload.decode("utf-8"))
            if stdscr:
                stdscr.addstr(f"\nRFID chip detected on {topic}: {data}")
                stdscr.refresh()

            # Don't interrupt if a song is already playing (including agent)
            if is_song_playing() or "agent" in global_trigger_status.lower():
                if stdscr:
                    stdscr.addstr(f"\nSong already playing, ignoring RFID trigger")
                    stdscr.refresh()
                return

            # Trigger the agent song
            if stdscr:
                stdscr.addstr(f"\n--- RFID triggered agent song ---")
                stdscr.refresh()

            # Get color from RFID data
            color_value = data.get("color", "")

            # Extract box number from topic (e.g., sensors/rfid/box1/chip -> box1)
            box_id = topic.split("/")[-2] if "/" in topic else "box1"

            # Store for later use when agent finishes
            last_rfid_color = color_value
            last_rfid_box_id = box_id

            start_song(stdscr, "agent", color=color_value, box_id=box_id)

            # Note: The next song will be triggered automatically when agent finishes
            # (handled in on_message when trigger becomes empty)
    except json.JSONDecodeError as e:
        if stdscr:
            stdscr.addstr(f"\nFailed to parse RFID JSON: {e}")
            stdscr.refresh()
    except Exception as e:
        if stdscr:
            stdscr.addstr(f"\nError processing RFID: {e}")
            stdscr.refresh()

def on_brightness_message(client, userdata, msg):
    """Handle incoming brightness MQTT messages."""
    global brightness, last_published_brightness, stdscr
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_brightness = float(payload.get(MQTT_BRIGHTNESS_FIELD, 0.0))
        brightness = new_brightness
    except (json.JSONDecodeError, ValueError):
        brightness = 0.0

def on_manual_brightness_message(client, userdata, msg):
    """Handle incoming manual brightness MQTT messages for songs."""
    global manual_brightness, stdscr
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        new_manual_brightness = float(payload.get(MQTT_MANUAL_BRIGHTNESS_FIELD, 0.0))
        manual_brightness = new_manual_brightness
        if stdscr:
            stdscr.addstr(f"\nManual brightness updated: {manual_brightness}")
            stdscr.refresh()
    except (json.JSONDecodeError, ValueError) as e:
        if stdscr:
            stdscr.addstr(f"\nFailed to parse manual brightness: {e}")
            stdscr.refresh()

client = mqtt.Client()

def is_mqtt_available():
    """Check if the MQTT broker inside Docker is running.

    Use a temporary client to avoid changing the state of the global
    `client` instance used later for subscriptions and the loop.
    """
    try:
        temp_client = mqtt.Client()
        temp_client.connect(MQTT_BROKER, 1883, 3)
        temp_client.disconnect()
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

def get_latest_manual_brightness():
    """Get the latest retained manual brightness from MQTT."""
    global manual_brightness, stdscr

    # Wait for MQTT to deliver retained message - max 30 retries, then default to 0.25
    if stdscr:
        stdscr.addstr(f"\nWaiting for manual_brightness from MQTT (current: {manual_brightness})...")
        stdscr.refresh()

    # Poll up to 30 times (3 seconds), then default to 0.25
    retry_count = 0
    max_retries = 30
    while manual_brightness is None and retry_count < max_retries:
        time.sleep(0.1)
        retry_count += 1

    if manual_brightness is None:
        manual_brightness = 0.25
        # Publish the default value to MQTT
        client.publish(MQTT_MANUAL_BRIGHTNESS_TOPIC, json.dumps({MQTT_MANUAL_BRIGHTNESS_FIELD: manual_brightness}), retain=True)
        stdscr.addstr(f"Manual brightness not found, set to default 0.25 and published\n")
    else:
        if stdscr:
            stdscr.addstr(f"\nGot manual_brightness from MQTT: {manual_brightness}")
            stdscr.refresh()

def publish_brightness():
    """Publish current brightness to MQTT."""
    global last_published_brightness
    updated_payload = json.dumps({MQTT_BRIGHTNESS_FIELD: brightness})
    client.publish(MQTT_BRIGHTNESS_TOPIC, updated_payload, retain=True)
    last_published_brightness = brightness  # Track what we published

def setup_mqtt():
    # Use on_connect to perform subscriptions so they occur after a successful
    # connection. Keep a fallback on_message as well.
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER)
    client.loop_start()


def on_connect(client, userdata, flags, rc):
    """Called when the MQTT client connects. Subscribe and register
    per-topic callbacks here to ensure subscriptions are active after
    reconnects as well.
    """
    try:
        if stdscr:
            stdscr.addstr(f"\nConnected to MQTT broker (rc={rc})")
            stdscr.refresh()
    except Exception:
        pass

    # Trigger topic: use dedicated callback (also keep default handler)
    client.message_callback_add(MQTT_TRIGGER_TOPIC, on_message)
    client.subscribe(MQTT_TRIGGER_TOPIC)

    # Sensors
    client.message_callback_add("sensors/#", on_sensors_message)
    client.subscribe("sensors/#")

    # RFID
    client.message_callback_add(f"{MQTT_RFID_TOPIC}/#", on_rfid_message)
    client.subscribe(f"{MQTT_RFID_TOPIC}/#")

    # Brightness topics
    client.message_callback_add(MQTT_BRIGHTNESS_TOPIC, on_brightness_message)
    client.subscribe(MQTT_BRIGHTNESS_TOPIC)
    client.message_callback_add(MQTT_MANUAL_BRIGHTNESS_TOPIC, on_manual_brightness_message)
    client.subscribe(MQTT_MANUAL_BRIGHTNESS_TOPIC)

def stop(stdscr):
    """Send a request to stop the trigger."""
    try:
        res = requests.post(f"{TRIGGER_URL_BASE}/stop", timeout=1)
        stdscr.addstr(f"\nTrigger stopped, HTTP status: {res.status_code}")
        stdscr.refresh()
    except requests.RequestException as err:
        stdscr.addstr(f"\nError while stopping trigger: {err}")
        stdscr.refresh()

def start_song(stdscr, song_name: str, start_offset_seconds: float = 0, color: str = "1", box_id: str = "box1"):
    """Start a song with an optional start offset in seconds."""
    global requested_song, is_playing_trigger, brightness, manual_brightness, current_song_index
    requested_song = song_name  # Set the requested song global so we can check if it's playing
    is_playing_trigger = False  # Mark that we're playing a song, not a trigger

    # manual_brightness should already be up-to-date from the MQTT callback
    # Just use the current value
    if manual_brightness is not None:
        brightness = manual_brightness
        publish_brightness()
        stdscr.addstr(f"\nRestoring brightness to manual brightness {manual_brightness} for song")
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

    # Always send box messages, even if HTTP request failed (song might still play)
    time.sleep(2)  # wait before shutting down boxes
    # Send MQTT message with color and master_state
    color_value = color
    response_payload = json.dumps({
        "color": color_value,
        "master_state": 0
    })
    # Publish to all box leds topics (box1 through box5)
    for box_num in range(1, 6):
        leds_topic = f"{MQTT_RFID_TOPIC}/box{box_num}/leds"
        client.publish(leds_topic, response_payload, retain=True)
    if stdscr:
        stdscr.addstr(f"\nPublished song status to all boxes: color={color_value}, master_state=0")
        stdscr.refresh()

def trigger(stdscr, trigger_name: str):
    """Send a trigger request."""
    global is_playing_trigger, brightness, trigger_baseline_brightness, current_trigger_index
    is_playing_trigger = True  # Mark that we're playing a trigger

    # When starting a trigger, set brightness to trigger baseline (0.1)
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

        # Send MQTT message with color based on trigger index and master_state=2
        color_value = (current_trigger_index % 5) + 1  # Cycle colors 1-5
        response_payload = json.dumps({
            "color": color_value,
            "master_state": 2
        })
        # Publish to all box leds topics (box1 through box5)
        for box_num in range(1, 6):
            leds_topic = f"{MQTT_RFID_TOPIC}/box{box_num}/leds"
            client.publish(leds_topic, response_payload, retain=True)
        if stdscr:
            stdscr.addstr(f"\nPublished trigger status to all boxes: color={color_value}, master_state=2")
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
    global trigger_active, stdscr, brightness, current_trigger_index, current_song_index, last_trigger_change, baseline_brightness, manual_brightness
    stdscr = screen  # Make stdscr available globally
    last_brightness_update = time.time()
    last_trigger_change = time.time()  # Track when we last changed the trigger
    previous_motion_state = False  # Track motion state changes
    was_song_playing = False  # Track previous song state to detect when songs end

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

    # Initialize manual brightness
    get_latest_manual_brightness()
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

        # Detect when a song finishes and reset the timer
        song_currently_playing = is_song_playing()
        if was_song_playing and not song_currently_playing:
            # Song just finished, reset the timer to start counting now
            last_trigger_change = current_time
            stdscr.addstr(f"\nSong finished, resetting trigger cycle timer")
            stdscr.refresh()
        was_song_playing = song_currently_playing

        # Check if it's time to cycle to the next trigger (but only if no song is playing)
        if not song_currently_playing and current_time - last_trigger_change >= TRIGGER_CYCLE_INTERVAL:
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
        # - For songs: brightness stays at manual_brightness (from manual_brightness topic)
        # - For triggers: motion controls brightness (0.05 baseline -> manual_brightness with motion)
        # - Increase rate: 0.1 per 0.25s (fast)
        # - Decrease rate: spread over 30 seconds (slow)
        if current_time - last_brightness_update >= 0.25:  # Adjust every 0.25 seconds
            if is_song_playing():
                # During songs, keep brightness at manual_brightness (from manual_brightness topic)
                if manual_brightness is not None and brightness != manual_brightness:
                    brightness = manual_brightness
                    publish_brightness()
                    stdscr.addstr(f"\nSong playing - maintaining manual brightness: {brightness}")
                    stdscr.refresh()
            elif is_playing_trigger:
                # For triggers, motion controls brightness
                current_baseline = trigger_baseline_brightness

                if motion_detected:
                    # Motion detected - increase brightness quickly to manual_brightness
                    target_brightness = manual_brightness if manual_brightness is not None else 1.0
                    if brightness < target_brightness:
                        brightness = min(target_brightness, round(brightness + 0.1, 1))
                        publish_brightness()
                        stdscr.addstr(f"\nMotion detected - brightness: {brightness}")
                        stdscr.refresh()
                    previous_motion_state = True
                else:
                    # No motion - decrease brightness slowly to baseline over 30 seconds
                    # Decrease rate: (1.0 - 0.05) / 30 seconds = 0.0317 per second
                    # Per 0.25s interval: 0.0317 / 4 ≈ 0.008 per update
                    if brightness > current_baseline:
                        decrease_amount = 0.008
                        brightness = max(current_baseline, brightness - decrease_amount)
                        publish_brightness()
                        stdscr.addstr(f"\nNo motion - brightness: {brightness:.3f}")
                        stdscr.refresh()
                    previous_motion_state = False

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
