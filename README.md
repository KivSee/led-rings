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

## Running Triggers

### Stop Playing

```sh
yarn stop
```
