#!/usr/bin/env python3
"""
PIR Motion Sensor Monitor for Maison Mirror

Monitors a PIR motion sensor on GPIO pin 17 and wakes/sleeps the mirror
based on motion detection. After 5 minutes of no motion, the mirror
goes to sleep (display turns off). Motion detected wakes it back up.

Hardware:
  - PIR motion sensor connected to GPIO 17 (with 3.3V and GND)
  - Raspberry Pi 5 with Raspberry Pi OS

Usage:
  sudo python3 motion_sensor.py
"""

import time
import requests
import sys

try:
    import RPi.GPIO as GPIO
except (ImportError, RuntimeError):
    print("[MOTION] Warning: RPi.GPIO not available. Running in simulation mode.")
    GPIO = None

# Configuration
PIR_PIN = 17                    # GPIO pin for PIR sensor
MOTION_TIMEOUT = 5 * 60         # 5 minutes of no motion = sleep
API_BASE_URL = "http://127.0.0.1:8000"
CHECK_INTERVAL = 1              # Check motion every 1 second

class MotionSensor:
    def __init__(self):
        self.last_motion_time = time.time()
        self.is_awake = True

        if GPIO:
            # Setup GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(PIR_PIN, GPIO.IN)
            print(f"[MOTION] PIR sensor initialized on GPIO {PIR_PIN}")
        else:
            print("[MOTION] Running in simulation mode (no GPIO)")

    def read_motion(self):
        """Read current motion state from PIR sensor"""
        if GPIO:
            return GPIO.input(PIR_PIN) == GPIO.HIGH
        else:
            # Simulation mode: no motion detected
            return False

    def wake_mirror(self):
        """Wake the mirror by setting display sleep to False"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/config/display/sleep",
                json={"sleep": False},
                timeout=5
            )
            if response.ok:
                print("[MOTION] ✓ Mirror awake")
                self.is_awake = True
            else:
                print(f"[MOTION] Failed to wake mirror: {response.status_code}")
        except Exception as e:
            print(f"[MOTION] Error waking mirror: {e}")

    def sleep_mirror(self):
        """Put mirror to sleep by setting display sleep to True"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/config/display/sleep",
                json={"sleep": True},
                timeout=5
            )
            if response.ok:
                print("[MOTION] ✓ Mirror sleeping")
                self.is_awake = False
            else:
                print(f"[MOTION] Failed to sleep mirror: {response.status_code}")
        except Exception as e:
            print(f"[MOTION] Error sleeping mirror: {e}")

    def run(self):
        """Main monitoring loop"""
        print("[MOTION] Motion sensor monitor started")
        print(f"[MOTION] Timeout: {MOTION_TIMEOUT}s of no motion = sleep")

        try:
            while True:
                motion_detected = self.read_motion()

                if motion_detected:
                    # Motion detected - update last motion time
                    self.last_motion_time = time.time()

                    # Wake mirror if it's asleep
                    if not self.is_awake:
                        print("[MOTION] Motion detected! Waking mirror...")
                        self.wake_mirror()

                else:
                    # No motion - check if timeout exceeded
                    time_since_motion = time.time() - self.last_motion_time

                    if time_since_motion > MOTION_TIMEOUT and self.is_awake:
                        print(f"[MOTION] No motion for {MOTION_TIMEOUT}s. Sleeping mirror...")
                        self.sleep_mirror()

                time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            print("\n[MOTION] Shutting down motion sensor monitor")
        finally:
            if GPIO:
                GPIO.cleanup()
                print("[MOTION] GPIO cleaned up")

def main():
    sensor = MotionSensor()
    sensor.run()

if __name__ == "__main__":
    main()
