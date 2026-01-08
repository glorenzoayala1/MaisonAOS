# Quick Test Guide - "Hey Lorenzo" Wake Word

## Test on Your Mac Right Now

### 1. Setup Virtual Environment

```bash
cd mirror-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the Test Script

```bash
./test_wake_word.sh
```

This will:
- ✓ Check all dependencies are installed
- ✓ Verify your Porcupine API key is in .env
- ✓ Confirm the "Hey Lorenzo" wake word file exists
- ✓ List your available microphones
- ✓ Start listening for "Hey Lorenzo"

### 3. Test It!

Once you see:
```
[WAKE] 🎧 Listening for wake word...
[WAKE] Say: 'Hey Lorenzo'
```

**Say "Hey Lorenzo"** into your microphone.

You should see:
```
[WAKE] 🎤 Wake word detected at 14:23:45
[WAKE] Starting voice interaction...
```

### 4. Stop Testing

Press `Ctrl+C` to stop the listener.

---

## Test on Raspberry Pi

### After Uploading Code to Pi

```bash
# SSH into Pi
ssh pi@<pi-ip-address>

# Navigate to project
cd /home/pi/maison-mirror/mirror-server

# Activate virtual environment
source venv/bin/activate

# Run test script
./test_wake_word.sh
```

Say "Hey Lorenzo" with your M1 USB lavalier mic plugged in!

---

## Troubleshooting

### "No module named pvporcupine"

```bash
pip install pvporcupine sounddevice python-dotenv soundfile
```

### "PORCUPINE_API_KEY not found"

Make sure `app/.env` contains:
```bash
PORCUPINE_API_KEY=youbu6byNHKECx6q2eqApZlr9hllcMBHKKzPiRox0lvg/dfetJjEUFXMg==
```

### "Wake word file not found"

Check the file exists:
```bash
ls -la wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn
```

If missing, the system will fall back to "jarvis" keyword.

### "No audio devices found" or "Can't detect microphone"

**On Mac:**
```bash
# List audio devices
python3 -c "import sounddevice as sd; print(sd.query_devices())"
```

**On Raspberry Pi:**
```bash
# Check USB mic is detected
arecord -l

# Test recording
arecord -d 3 test.wav
aplay test.wav
```

### Wake word not detecting

1. **Speak clearly**: Say "Hey Lorenzo" at normal volume, 1-3 feet from mic
2. **Check mic level**: Make sure mic is not muted
3. **Try built-in keyword**: Edit `wake_word_listener.py` line 33:
   ```python
   BUILTIN_KEYWORD = "jarvis"
   ```
   Then say "jarvis" to test

---

## What Happens When Wake Word is Detected

1. Porcupine detects "Hey Lorenzo"
2. System calls `handle_voice_session()` from `app/voice_zo.py`
3. Microphone starts recording for your question
4. Whisper transcribes your speech to text
5. GPT-4 processes your question
6. OpenAI TTS speaks the response

**Note**: The voice interaction system (`voice_zo.py`) needs to be implemented/working for the full flow to work. The wake word listener will detect "Hey Lorenzo" but might fail when trying to call `handle_voice_session()` if that's not set up yet.

---

## For Production (Raspberry Pi)

The wake word listener will run automatically as a systemd service:

```bash
# Check status
sudo systemctl status maison-wake-word.service

# View logs
sudo journalctl -u maison-wake-word.service -f

# Restart service
sudo systemctl restart maison-wake-word.service
```

---

## Your Configuration

**API Key**: ✓ Set in .env
**Wake Word File**: `wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn`
**Wake Phrase**: "Hey Lorenzo"
**Platform**: Raspberry Pi v4.0.0

Ready to test! Run `./test_wake_word.sh` 🎤
