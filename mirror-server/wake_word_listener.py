#!/usr/bin/env python3
"""
Wake Word Listener for Maison Mirror

Uses Picovoice Porcupine for wake word detection with custom wake words.
Listens for "Hey Lorenzo" (or custom wake word) and triggers voice interaction.

Setup:
1. Get Porcupine API key from https://console.picovoice.ai/
2. Create custom wake word "Hey Lorenzo" at https://console.picovoice.ai/ppn
3. Download the .ppn file and place in: wake_words/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn
4. Add PORCUPINE_API_KEY to .env file

Usage:
    python3 wake_word_listener.py
"""

import os
import sys
import struct
import time
from datetime import datetime

try:
    import pvporcupine
except ImportError:
    print("[WAKE] Error: pvporcupine not installed")
    print("Install with: pip install pvporcupine")
    sys.exit(1)

try:
    import sounddevice as sd
except ImportError:
    print("[WAKE] Error: sounddevice not installed")
    print("Install with: pip install sounddevice")
    sys.exit(1)

from dotenv import load_dotenv

# Add app directory to path so we can import config_store
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))
from config_store import get_api_key

# Load environment variables as fallback
load_dotenv("app/.env")

# Configuration
PORCUPINE_API_KEY = get_api_key("PORCUPINE_API_KEY")
WAKE_WORD_PATH = os.getenv("WAKE_WORD_PATH", "wake_words/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn")

# Fallback to built-in keywords if no custom wake word
USE_BUILTIN_KEYWORD = not os.path.exists(WAKE_WORD_PATH)
BUILTIN_KEYWORD = "jarvis"  # Options: alexa, americano, blueberry, bumblebee, computer, grapefruit, grasshopper, hey google, hey siri, jarvis, ok google, picovoice, porcupine, terminator

class WakeWordListener:
    def __init__(self):
        if not PORCUPINE_API_KEY:
            print("[WAKE] ❌ Error: PORCUPINE_API_KEY not found in .env file")
            print("[WAKE] Get your API key from: https://console.picovoice.ai/")
            sys.exit(1)

        self.porcupine = None
        self.audio_stream = None
        self.setup_porcupine()

    def setup_porcupine(self):
        """Initialize Porcupine wake word engine"""
        try:
            if USE_BUILTIN_KEYWORD:
                print(f"[WAKE] Using built-in keyword: '{BUILTIN_KEYWORD}'")
                print(f"[WAKE] To use custom wake word 'Hey Lorenzo':")
                print(f"[WAKE]   1. Create wake word at: https://console.picovoice.ai/ppn")
                print(f"[WAKE]   2. Download .ppn file")
                print(f"[WAKE]   3. Place at: {WAKE_WORD_PATH}")
                print("")

                self.porcupine = pvporcupine.create(
                    access_key=PORCUPINE_API_KEY,
                    keywords=[BUILTIN_KEYWORD]
                )
            else:
                print(f"[WAKE] Using custom wake word from: {WAKE_WORD_PATH}")
                self.porcupine = pvporcupine.create(
                    access_key=PORCUPINE_API_KEY,
                    keyword_paths=[WAKE_WORD_PATH]
                )

            print(f"[WAKE] ✓ Porcupine initialized")
            print(f"[WAKE] Sample rate: {self.porcupine.sample_rate} Hz")
            print(f"[WAKE] Frame length: {self.porcupine.frame_length}")
            print("")

        except Exception as e:
            print(f"[WAKE] ❌ Failed to initialize Porcupine: {e}")
            print(f"[WAKE] Make sure your API key is valid: https://console.picovoice.ai/")
            sys.exit(1)

    def list_audio_devices(self):
        """List available audio input devices"""
        print("[WAKE] Available audio devices:")
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0:
                print(f"  [{i}] {device['name']} (inputs: {device['max_input_channels']})")
        print("")

    def trigger_voice_interaction(self):
        """Trigger the voice interaction system"""
        print(f"[WAKE] 🎤 Wake word detected at {datetime.now().strftime('%H:%M:%S')}")

        # Play acknowledgment sound (optional)
        # You can add a beep or tone here

        # Trigger voice interaction via the voice system
        try:
            # Import here to avoid circular dependencies
            from app.voice_zo import handle_voice_session

            print("[WAKE] Starting voice interaction...")
            response = handle_voice_session()
            print(f"[WAKE] ✓ Voice interaction complete: {response}")

        except Exception as e:
            print(f"[WAKE] ❌ Voice interaction failed: {e}")

    def run(self):
        """Main listening loop"""
        self.list_audio_devices()

        print("[WAKE] 🎧 Listening for wake word...")
        if USE_BUILTIN_KEYWORD:
            print(f"[WAKE] Say: '{BUILTIN_KEYWORD}'")
        else:
            print(f"[WAKE] Say: 'Hey Lorenzo'")
        print("[WAKE] Press Ctrl+C to stop")
        print("")

        try:
            # Open audio stream
            self.audio_stream = sd.InputStream(
                channels=1,
                samplerate=self.porcupine.sample_rate,
                blocksize=self.porcupine.frame_length,
                dtype='int16'
            )

            self.audio_stream.start()

            while True:
                # Read audio frame
                audio_frame, overflowed = self.audio_stream.read(self.porcupine.frame_length)

                if overflowed:
                    print("[WAKE] ⚠️  Audio buffer overflow")

                # Convert to correct format
                pcm = struct.unpack_from("h" * self.porcupine.frame_length, audio_frame)

                # Process frame
                keyword_index = self.porcupine.process(pcm)

                if keyword_index >= 0:
                    # Wake word detected!
                    self.trigger_voice_interaction()

                    # Brief pause to avoid multiple triggers
                    time.sleep(1)

        except KeyboardInterrupt:
            print("\n[WAKE] Shutting down wake word listener")

        finally:
            if self.audio_stream:
                self.audio_stream.stop()
                self.audio_stream.close()

            if self.porcupine:
                self.porcupine.delete()

            print("[WAKE] ✓ Cleanup complete")

def main():
    listener = WakeWordListener()
    listener.run()

if __name__ == "__main__":
    main()
