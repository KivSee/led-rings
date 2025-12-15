import requests
import time
import curses
import paho.mqtt.client as mqtt

# Replace with actual values
TRIGGER_SERVICE_IP = "localhost"
TRIGGER_SERVICE_PORT = 8083
MQTT_BROKER = "localhost"
MQTT_TOPIC = "trigger"

TRIGGER_URL_BASE = f"http://{TRIGGER_SERVICE_IP}:{TRIGGER_SERVICE_PORT}"

# Global variable to store MQTT message
global_trigger_status = ""
trigger_active = False  # Track if the trigger is active
requested_song = ""  # Store the requested song name

def on_message(client, userdata, msg):
    global global_trigger_status, requested_song, trigger_active
    global_trigger_status = msg.payload.decode("utf-8").strip()
    if (requested_song in global_trigger_status):  # True if the song name is in the payload
        trigger_active = True
    else:
        trigger_active = False

client = mqtt.Client()

def is_mqtt_available():
    """Check if the MQTT broker inside Docker is running."""
    try:
        client.connect(MQTT_BROKER, 1883, 3)  # Timeout after 3 seconds
        client.disconnect()
        return True
    except:
        return False

def setup_mqtt():
    client.on_message = on_message
    client.connect(MQTT_BROKER)
    client.subscribe(MQTT_TOPIC)
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
    global requested_song
    requested_song = song_name  # Set the requested song global so we can check if it's playing
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

def main(stdscr):
    global trigger_active
    start_time = None
    song_playing = False
    last_press_time = None
    song_playing_printed = False  # Flag to ensure "Song playing" is printed only once

    # Setup the screen
    stdscr.nodelay(True)
    stdscr.clear()
    stdscr.scrollok(True)  # Allow scrolling

    setup_mqtt()

    while not trigger(stdscr, "random"):  # Send the random trigger until successful
        time.sleep(5)
    time.sleep(1)  # wait for the trigger to get to the rings
    trigger(stdscr, "random")  # Send it again to make sure they all got it

    stdscr.addstr("Hold SPACE key for 5 seconds to start the song 'Aladdin'.")
    stdscr.refresh()
    while True:
        key = stdscr.getch()
        current_time = time.time()

        # Handle SPACE key press
        if key == ord(' '):
            if start_time is None:
                start_time = current_time
            elif current_time - start_time >= 5 and not song_playing:
                start_song(stdscr, "aladdin")
                stdscr.addstr("\nSong 'Aladdin' started!")
                stdscr.refresh()
                song_playing = True
                song_playing_printed = False  # Reset the flag
            last_press_time = current_time  # Update last press time

        # Handle song playing logic
        if song_playing:
            if trigger_active and not song_playing_printed:  # Print only once
                stdscr.addstr("\nSong playing detected from MQTT!")
                stdscr.refresh()
                song_playing_printed = True  # Set the flag to prevent repeated prints

            if not trigger_active and song_playing_printed:  # Check if the song has finished
                stdscr.addstr("\nSong finished detected from MQTT!")
                stdscr.refresh()
                song_playing = False
                start_time = None  # Reset start_time for the next song
                trigger(stdscr, "random")  # Send an random trigger

        # Handle inactivity logic
        # if song_playing and last_press_time and current_time - last_press_time > 2:
        #     stop(stdscr)
        #     stdscr.addstr("\nSong 'Aladdin' stopped due to inactivity!")
        #     stdscr.refresh()
        #     song_playing = False
        #     start_time = None
        #     trigger(stdscr, "random")  # Send an random trigger

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
