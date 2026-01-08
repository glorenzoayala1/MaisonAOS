# "Hey Lorenzo" Wake Word Setup Guide

Quick guide to set up the custom "Hey Lorenzo" wake word for your Maison Mirror.

## What You Need

1. **Porcupine API Key** (free tier available)
2. **Custom Wake Word File** (.ppn file trained with "Hey Lorenzo")

---

## Step 1: Get Your Porcupine API Key

1. Go to **https://console.picovoice.ai/**
2. Click **"Sign Up"** (or **"Log In"** if you have an account)
3. Complete the free registration
4. Once logged in, you'll see your **Access Key** on the dashboard
5. Copy the Access Key (looks like: `abc123xyz...`)

### Add API Key to .env File

Open `mirror-server/app/.env` and paste your key:

```bash
PORCUPINE_API_KEY=your_access_key_here
```

**Example:**
```bash
PORCUPINE_API_KEY=Jkl8mNoPqRsTuVwXyZ1234567890aBcDeFgHiJkLmN=
```

---

## Step 2: Create Custom "Hey Lorenzo" Wake Word

### Option A: Train Your Own (Recommended)

1. Go to **https://console.picovoice.ai/ppn**
2. Click **"Train a Wake Word"** or **"Create Wake Word"**
3. Enter the wake phrase: **`Hey Lorenzo`**
4. Select target platform: **`Raspberry Pi`** (or your platform)
5. Click **"Train"**
6. Wait 2-5 minutes for training to complete
7. Download the `.ppn` file when ready

The file will be named something like:
```
hey-lorenzo_en_raspberry-pi_v3_0_0.ppn
```

### Option B: Use Pre-trained File (If Available)

If you already have a `.ppn` file, skip to Step 3.

---

## Step 3: Install Wake Word File

1. **Create the wake_words directory** (if it doesn't exist):
   ```bash
   mkdir -p mirror-server/wake_words
   ```

2. **Move your downloaded .ppn file** to the directory:
   ```bash
   # Example on Mac:
   mv ~/Downloads/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn mirror-server/wake_words/
   ```

3. **Update .env file** with the exact filename:
   ```bash
   WAKE_WORD_PATH=wake_words/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn
   ```

---

## Step 4: Test the Wake Word

### On Your Mac (Testing)

```bash
cd mirror-server
source venv/bin/activate
python3 wake_word_listener.py
```

**Say:** "Hey Lorenzo"

You should see:
```
[WAKE] 🎤 Wake word detected at 14:23:45
[WAKE] Starting voice interaction...
```

### On Raspberry Pi (Production)

The wake word listener will run automatically via systemd service.

**Manual test:**
```bash
cd /home/pi/maison-mirror/mirror-server
source venv/bin/activate
python3 wake_word_listener.py
```

**Check service status:**
```bash
sudo systemctl status maison-wake-word.service
```

**View logs:**
```bash
sudo journalctl -u maison-wake-word.service -f
```

---

## Troubleshooting

### "PORCUPINE_API_KEY not found"

**Problem:** API key not in .env file

**Solution:**
```bash
cd mirror-server
nano app/.env
# Add: PORCUPINE_API_KEY=your_key_here
```

### "Wake word file not found"

**Problem:** `.ppn` file path is incorrect

**Solution:**
1. Check the file exists:
   ```bash
   ls -la mirror-server/wake_words/
   ```
2. Verify the filename matches exactly in `.env`:
   ```bash
   cat mirror-server/app/.env | grep WAKE_WORD_PATH
   ```

### "Using built-in keyword: jarvis"

**Problem:** Custom wake word file not found, falling back to built-in

**Solution:**
- This is OK for testing! You can say "jarvis" instead
- To use "Hey Lorenzo", follow Step 3 above

### "API key invalid"

**Problem:** Wrong or expired API key

**Solution:**
1. Go to https://console.picovoice.ai/
2. Check your Access Key
3. Copy the full key (no spaces or line breaks)
4. Update `.env` file
5. Restart the wake word listener

### Wake word not detecting

**Problem:** Microphone issues or wake word sensitivity

**Solutions:**
1. **Check microphone**:
   ```bash
   # List audio devices
   arecord -l

   # Test recording
   arecord -d 3 test.wav
   aplay test.wav
   ```

2. **Speak clearly**:
   - Say "Hey Lorenzo" at normal volume
   - Pronounce each word clearly
   - Stand 1-3 feet from microphone

3. **Check service logs**:
   ```bash
   sudo journalctl -u maison-wake-word.service -n 50
   ```

---

## Advanced: Using Different Wake Words

### Change to Built-in Keyword

Don't want to create a custom wake word? Edit `wake_word_listener.py`:

```python
BUILTIN_KEYWORD = "jarvis"  # Change this to any option below
```

**Available built-in keywords:**
- `alexa`
- `americano`
- `blueberry`
- `bumblebee`
- `computer`
- `grapefruit`
- `grasshopper`
- `hey google`
- `hey siri`
- `jarvis` (default)
- `ok google`
- `picovoice`
- `porcupine`
- `terminator`

### Create Multiple Wake Words

You can train multiple wake words (e.g., "Hey Lorenzo", "Hey Mirror", "Computer"):

1. Train each wake word separately at https://console.picovoice.ai/ppn
2. Download all `.ppn` files
3. Place in `wake_words/` directory
4. Modify `wake_word_listener.py` to load multiple keyword paths

---

## Platform-Specific Files

Make sure you download the correct `.ppn` file for your platform:

| Platform | File Name Pattern |
|----------|-------------------|
| Raspberry Pi (4/5) | `hey-lorenzo_en_raspberry-pi_v3_0_0.ppn` |
| Linux (x64) | `hey-lorenzo_en_linux_v3_0_0.ppn` |
| Mac (M1/M2) | `hey-lorenzo_en_mac_v3_0_0.ppn` |
| Windows | `hey-lorenzo_en_windows_v3_0_0.ppn` |

**Important:** The Raspberry Pi file works on both Pi 4 and Pi 5.

---

## Free Tier Limits

Porcupine free tier includes:
- ✓ Unlimited wake word detections
- ✓ Up to 3 custom wake words
- ✓ Personal/development use

For commercial use, see: https://picovoice.ai/pricing/

---

## Summary

**Quick checklist:**
- [ ] Created Picovoice account at https://console.picovoice.ai/
- [ ] Copied Access Key to `mirror-server/app/.env` as `PORCUPINE_API_KEY`
- [ ] Trained "Hey Lorenzo" wake word at https://console.picovoice.ai/ppn
- [ ] Downloaded `.ppn` file to `mirror-server/wake_words/`
- [ ] Updated `WAKE_WORD_PATH` in `.env` with filename
- [ ] Tested with `python3 wake_word_listener.py`
- [ ] Said "Hey Lorenzo" and got response

**You're done!** Your mirror will now respond to "Hey Lorenzo" 🎉

For more help, see:
- `mirror-server/wake_words/README.md`
- `PI_SETUP.md`
- https://picovoice.ai/docs/porcupine/
