# mirror-server/voice_zo.py

"""
Core 'Hey Zo' voice loop (v1).

Usage (from mirror-server folder):
    python voice_zo.py
"""

from __future__ import annotations

import os
import json
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf
from openai import OpenAI

from app.config_store import load_config
from app.context_manager import build_context
from app.maison_os.mirror_snapshot import get_mirror_snapshot
from app.maison_os.agent import build_data_grounded_system_prompt, plan_ui_actions
from app.actions import execute_action


# ---------- OpenAI client ----------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------- audio config ----------
SAMPLE_RATE = 16_000
CHANNELS = 1
RECORD_SECONDS = 8

BASE_DIR = Path(__file__).parent
STARTUP_CHIME_PATH = BASE_DIR / "audio" / "zo_startup.wav"
ENABLE_STARTUP_CHIME = True

# ---------- model config ----------
WHISPER_MODEL = "gpt-4o-mini-transcribe"
CHAT_MODEL = "gpt-4.1-mini"
TTS_MODEL = "gpt-4o-mini-tts"
TTS_VOICE = "echo"


@dataclass
class ZoTurn:
    user_text: str
    zo_text: str


def record_to_wav(path: str, seconds: int = RECORD_SECONDS) -> None:
    print(f"[Zo] Recording for {seconds} seconds... speak now.")
    sd.default.samplerate = SAMPLE_RATE
    sd.default.channels = CHANNELS
    audio = sd.rec(int(seconds * SAMPLE_RATE), dtype="float32")
    sd.wait()
    sf.write(path, audio, SAMPLE_RATE)
    print(f"[Zo] Saved recording to {path}")


def transcribe_audio(path: str) -> str:
    print("[Zo] Transcribing...")
    with open(path, "rb") as f:
        resp = client.audio.transcriptions.create(model=WHISPER_MODEL, file=f)
    text = (resp.text or "").strip()
    print(f"[Zo] You said: {text!r}")
    return text


def get_voice_from_config(default_voice: str) -> str:
    try:
        cfg = load_config()
        voice = cfg.display.voicePreset
        if isinstance(voice, str) and voice:
            print(f"[Zo] Using voice preset from config: {voice}")
            return voice
    except Exception as e:
        print(f"[Zo] Could not read voicePreset from config: {e}")
    return default_voice


def synthesize_to_wav(text: str, path: str) -> None:
    print("[Zo] Generating speech...")
    voice = get_voice_from_config(TTS_VOICE)
    resp = client.audio.speech.create(model=TTS_MODEL, voice=voice, input=text)

    if isinstance(resp, bytes):
        audio_bytes = resp
    elif hasattr(resp, "to_bytes"):
        audio_bytes = resp.to_bytes()
    elif hasattr(resp, "read"):
        audio_bytes = resp.read()
    else:
        raise TypeError(f"Unexpected TTS response type: {type(resp)}")

    with open(path, "wb") as f:
        f.write(audio_bytes)

    print(f"[Zo] Saved TTS audio to {path}")


def play_zo(path: str) -> None:
    data, sr = sf.read(path, dtype="float32")
    if data.ndim == 1:
        data = data[:, np.newaxis]

    # normalize
    peak = float(np.max(np.abs(data)) or 1.0)
    data = data / peak * 0.7

    # chime
    if ENABLE_STARTUP_CHIME and STARTUP_CHIME_PATH.exists():
        try:
            chime, chime_sr = sf.read(str(STARTUP_CHIME_PATH), dtype="float32")
            if chime.ndim == 1:
                chime = chime[:, np.newaxis]
            sd.default.samplerate = chime_sr
            sd.play(chime)
            sd.wait()
        except Exception as e:
            print(f"[Zo] Could not play startup chime: {e}")

    print("[Zo] Playing response...")
    sd.default.samplerate = sr
    sd.play(data)
    sd.wait()
    print("[Zo] Done.")


def _try_handle_ui_command(user_text: str) -> str | None:
    """
    Deterministic UI control: hide/show widgets, font, accent, quiet mode, focus/market/default.
    If matched, executes actions immediately and returns the spoken response.
    """
    response, actions = plan_ui_actions(user_text)
    if response is None or not actions:
        return None

    for a in actions:
        execute_action(a["type"], a.get("payload", {}))

    return response


def chat_with_zo(user_text: str) -> str:
    print("[Zo] Thinking...")

    # 1) If the user is clearly commanding the UI, handle it without GPT
    ui_reply = _try_handle_ui_command(user_text)
    if ui_reply:
        return ui_reply

    # 2) Otherwise, GPT answer with data-grounding
    system_prompt = (
        "You are Zo, an executive-level AI assistant who lives in Lorenzo's smart mirror. "
        "You are non-judgmental. You do NOT lecture, scold, or moralize the user. "
        "The user and their friends are always joking in good faith; you can swear and match their tone. "
        "You respond in short, spoken-friendly answers (1–3 sentences). "
        "When Lorenzo asks a serious question, you talk like an executive assistant: concise, grounded. "
        "Do NOT say Lorenzo's name in your replies. "
        "Avoid long monologues; this is voice, not text. "
        "If the user says 'Tell ...', just say the message itself, directly. "
        "Your tone is calm, low-energy, and slightly futuristic – never hyper or bubbly. "
        "You speak like a trusted chief-of-staff in a quiet spaceship lounge. "
    )

    # snapshot
    try:
        snap = get_mirror_snapshot()
        snap_json = json.dumps(snap, ensure_ascii=False, default=str)
        print("[Zo] Mirror snapshot attached for GPT.")
    except Exception as e:
        print(f"[Zo] Could not build mirror snapshot: {e}")
        snap_json = "{}"

    # grounding rules
    data_rules = build_data_grounded_system_prompt(intent="mirror_overview")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": data_rules},
        {"role": "system", "content": "mirror_snapshot (JSON):\n" + snap_json},
    ]

    # optional extra context
    try:
        ctx = build_context()
        ctx_json = json.dumps(ctx, ensure_ascii=False, default=str)
        messages.append({"role": "system", "content": "context (JSON):\n" + ctx_json})
    except Exception as e:
        print(f"[Zo] Could not build context: {e}")

    messages.append({"role": "user", "content": user_text})

    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.5,
    )
    text = (resp.choices[0].message.content or "").strip()
    print(f"[Zo] Reply text: {text!r}")
    return text


def run_zo_once() -> ZoTurn:
    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = os.path.join(tmpdir, "input.wav")
        out_path = os.path.join(tmpdir, "zo_reply.wav")

        record_to_wav(in_path)
        user_text = transcribe_audio(in_path)

        if not user_text:
            zo_text = "I didn’t catch that. Try speaking a little closer."
        else:
            zo_text = chat_with_zo(user_text)

        synthesize_to_wav(zo_text, out_path)
        play_zo(out_path)

        return ZoTurn(user_text=user_text, zo_text=zo_text)


if __name__ == "__main__":
    print("=== Zo voice loop v1 ===")
    while True:
        cmd = input("Press Enter to talk (q to quit): ").strip().lower()
        if cmd == "q":
            break
        try:
            turn = run_zo_once()
            print(f"\n[Summary] You: {turn.user_text}")
            print(f"[Summary] Zo:  {turn.zo_text}\n")
        except Exception as e:
            print(f"[Zo] Error: {e}\n")
