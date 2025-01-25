# led-rings

## System Configuration

```sh
cat > .env <<EOF
LEDS_OBJECT_SERVICE_IP=<leds object service ip>
EOF
```

## Send Segments

```sh
yarn
yarn sync-segments
```

