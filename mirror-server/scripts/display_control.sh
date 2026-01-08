#!/bin/bash
# Display Control Script for Maison Mirror
# Controls HDMI display backlight on Raspberry Pi 5
#
# Usage:
#   ./display_control.sh on   - Turn display on
#   ./display_control.sh off  - Turn display off

set -e

ACTION="${1:-on}"

case "$ACTION" in
  on)
    echo "[DISPLAY] Turning display ON"

    # Method 1: vcgencmd (works on most Pi models)
    if command -v vcgencmd &> /dev/null; then
      vcgencmd display_power 1
    fi

    # Method 2: HDMI CEC (if TV supports CEC)
    if command -v cec-client &> /dev/null; then
      echo "on 0" | cec-client -s -d 1
    fi

    echo "[DISPLAY] Display turned on"
    ;;

  off)
    echo "[DISPLAY] Turning display OFF"

    # Method 1: vcgencmd
    if command -v vcgencmd &> /dev/null; then
      vcgencmd display_power 0
    fi

    # Method 2: HDMI CEC
    if command -v cec-client &> /dev/null; then
      echo "standby 0" | cec-client -s -d 1
    fi

    echo "[DISPLAY] Display turned off"
    ;;

  status)
    echo "[DISPLAY] Checking display status"

    if command -v vcgencmd &> /dev/null; then
      vcgencmd display_power
    else
      echo "[DISPLAY] vcgencmd not available"
    fi
    ;;

  *)
    echo "Usage: $0 {on|off|status}"
    exit 1
    ;;
esac
