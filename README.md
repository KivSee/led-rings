# led-rings

## System Configuration

```sh
cat > .env <<EOF
LEDS_OBJECT_SERVICE_IP=<leds object service ip>
SEQUENCE_SERVICE_IP=<sequence service ip>
TRIGGER_SERVICE_IP=<trigger service ip>
EOF
```

## Send Segments

```sh
yarn
yarn sync-segments
```

## Beat Detection

The system can detect beat positions from audio files using Python (librosa), replacing the fixed-BPM formula with actual beat timestamps.

### Setup

Install librosa into a Python virtualenv (in `~/.virtualenvs/`):

```sh
pip install -r scripts/requirements.txt
```

### Usage with Control Server

The control server auto-detects a Python with librosa at startup. It checks:

1. The `PYTHON` env var (if set)
2. `python` / `python3` on PATH
3. Any virtualenv in `~/.virtualenvs/*/`

On startup it logs which Python it found:

```
Control server listening on http://localhost:3080
Python for beat detection: C:\Users\...\.virtualenvs\kivsee-tools\Scripts\python.exe
```

Then use the **Detect Beats** button in the Timeline UI.

### Standalone Usage

You can also run beat detection directly from the command line:

```sh
python scripts/detect_beats.py path/to/audio.wav
```

This outputs a `.beats.json` file next to the audio file, which can be loaded in the UI via Load JSON.

## Running Triggers

### Stop Playing

```sh
yarn stop
```
