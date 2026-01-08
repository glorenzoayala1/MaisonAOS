"""
Continuous wake-word listener for 'Lorenzo' (Porcupine + sounddevice).

- Lists available microphones
- Forces correct input device
- Shows live mic heartbeat (RMS)
- Detects wake word
- Notifies Maison backend
"""

import sys
from pathlib import Path
import time

import numpy as np
import pvporcupine
import requests
import sounddevice as sd


# ---------- CONFIG ----------

# 🔑 Picovoice AccessKey
PORCUPINE_ACCESS_KEY = "bu6byNHKECx6q2eqApZlr9hllcMBHKKzPiRox0lvg/dfetJjEUFXMg=="

# 🎙 Wake word model
KEYWORD_FILENAME = "Lorenzo_en_mac_v3_0_0.ppn"

BASE_DIR = Path(__file__).parent
KEYWORD_PATH = BASE_DIR / "porcupine" / KEYWORD_FILENAME

# 🌐 Backend endpoints
BACKEND_ZO_TALK_URL = "http://127.0.0.1:8000/zo/talk"
AGENT_WAKE_URL = "http://127.0.0.1:8000/agent/wake"
AGENT_USER_SPOKE_URL = "http://127.0.0.1:8000/agent/user-spoke"

# 🎧 FORCE INPUT DEVICE (CHANGE THIS AFTER SEEING DEVICE LIST)
INPUT_DEVICE_INDEX = None  # e.g. 2


# ---------- UTIL ----------

def print_audio_devices():
    print("\n[zo_listener] Available audio devices:")
    for i, dev in enumerate(sd.query_devices()):
        print(f"  [{i}] {dev['name']} | inputs={dev['max_input_channels']}")
    print("")


def create_input_stream(porcupine: pvporcupine.Porcupine) -> sd.RawInputStream:
    sd.default.samplerate = porcupine.sample_rate
    sd.default.channels = 1

    if INPUT_DEVICE_INDEX is not None:
        sd.default.device = (INPUT_DEVICE_INDEX, None)

    stream = sd.RawInputStream(
        samplerate=porcupine.sample_rate,
        blocksize=porcupine.frame_length,
        dtype="int16",
        channels=1,
    )
    stream.start()
    return stream


# ---------- MAIN ----------

def main() -> None:
    if not KEYWORD_PATH.exists():
        print(f"[zo_listener] ❌ Keyword file not found: {KEYWORD_PATH}")
        sys.exit(1)

    print_audio_devices()

    porcupine = None
    stream = None
    frame_count = 0

    try:
        print("[zo_listener] Initializing Porcupine...")
        porcupine = pvporcupine.create(
            access_key=PORCUPINE_ACCESS_KEY,
            keyword_paths=[str(KEYWORD_PATH)],
        )

        print(
            f"[zo_listener] Porcupine ready | "
            f"sample_rate={porcupine.sample_rate}, "
            f"frame_length={porcupine.frame_length}"
        )

        stream = create_input_stream(porcupine)

        print("\n[zo_listener] 🎧 Listening for 'Hey Lorenzo'...\n")

        while True:
            data, _ = stream.read(porcupine.frame_length)
            pcm = np.frombuffer(data, dtype=np.int16)

            # ---- mic heartbeat ----
            frame_count += 1
            if frame_count % 50 == 0:
                rms = np.sqrt(np.mean(pcm.astype(np.float32) ** 2))
                print(f"[zo_listener] mic alive | rms={rms:.1f}")

            # ---- wake word ----
            keyword_index = porcupine.process(pcm)
            if keyword_index >= 0:
                print("\nWAKE WORD DETECTED: 'LORENZO'\n")

                # Notify agent
                try:
                    requests.post(AGENT_WAKE_URL, json={"source": "mirror"}, timeout=3)
                except Exception as e:
                    print(f"[zo_listener] /agent/wake error: {e}")

                # Run Zo pipeline
                try:
                    resp = requests.post(BACKEND_ZO_TALK_URL, timeout=600)
                    if resp.ok:
                        payload = resp.json()
                        user_text = payload.get("user_text", "")
                        zo_text = payload.get("zo_text", "")

                        print(
                            "[zo_listener] Zo response:\n"
                            f"    You: {user_text}\n"
                            f"    Zo : {zo_text}\n"
                        )

                        if user_text:
                            try:
                                requests.post(
                                    AGENT_USER_SPOKE_URL,
                                    json={"text": user_text, "source": "mirror"},
                                    timeout=3,
                                )
                            except Exception as e:
                                print(f"[zo_listener] /agent/user-spoke error: {e}")
                    else:
                        print(f"[zo_listener] Zo backend error: {resp.status_code}")
                except Exception as e:
                    print(f"[zo_listener] Zo pipeline failed: {e}")

                # Reacquire mic cleanly
                stream.stop()
                stream.close()
                time.sleep(0.5)
                stream = create_input_stream(porcupine)
                print("[zo_listener] 🎧 Listening again...\n")

    except KeyboardInterrupt:
        print("\n[zo_listener] Stopping listener")

    finally:
        if stream:
            stream.stop()
            stream.close()
        if porcupine:
            porcupine.delete()
        print("[zo_listener] Clean exit")


if __name__ == "__main__":
    main()
