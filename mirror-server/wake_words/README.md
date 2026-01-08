# Custom Wake Word Setup

This directory contains custom wake word files for Porcupine.

## Creating "Hey Lorenzo" Wake Word

### Step 1: Get Porcupine API Key

1. Go to https://console.picovoice.ai/
2. Sign up for a free account (or log in)
3. Copy your Access Key
4. Add it to `mirror-server/app/.env`:
   ```
   PORCUPINE_API_KEY=your_access_key_here
   ```

### Step 2: Create Custom Wake Word

1. Go to https://console.picovoice.ai/ppn
2. Click **"Train a Wake Word"**
3. Enter wake phrase: **"Hey Lorenzo"**
4. Select platform: **Raspberry Pi** (or your target platform)
5. Train the model (takes a few minutes)
6. Download the `.ppn` file

### Step 3: Install Wake Word File

1. Download the file (e.g., `hey-lorenzo_en_raspberry-pi_v3_0_0.ppn`)
2. Place it in this directory: `mirror-server/wake_words/`
3. Update `.env` file with the exact filename:
   ```
   WAKE_WORD_PATH=wake_words/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn
   ```

### Step 4: Test Wake Word

```bash
cd mirror-server
source venv/bin/activate
python3 wake_word_listener.py
```

Say "Hey Lorenzo" to test!

## Built-in Keywords (Fallback)

If you don't want to create a custom wake word, the system will use the built-in keyword "jarvis" by default.

Other built-in options (edit `wake_word_listener.py` to change):
- alexa
- americano
- blueberry
- bumblebee
- computer
- grapefruit
- grasshopper
- hey google
- hey siri
- jarvis (default)
- ok google
- picovoice
- porcupine
- terminator

## File Naming Convention

Porcupine wake word files follow this pattern:
```
{wake-phrase}_{language}_{platform}_v{version}.ppn
```

Example:
```
hey-lorenzo_en_raspberry-pi_v3_0_0.ppn
```

## Troubleshooting

### "PORCUPINE_API_KEY not found"
- Make sure you added the key to `mirror-server/app/.env`
- Restart the wake word listener

### "Wake word file not found"
- Check the file is in `mirror-server/wake_words/`
- Check the filename matches exactly in `.env`
- Fallback: System will use built-in "jarvis" keyword

### "API key invalid"
- Verify your API key at https://console.picovoice.ai/
- Make sure you copied the full key without spaces
- Check if your free tier is still active

## Platform-Specific Files

Make sure to download the correct `.ppn` file for your platform:
- **Raspberry Pi**: `raspberry-pi`
- **Linux**: `linux`
- **Mac**: `mac`
- **Windows**: `windows`

The Raspberry Pi file will work on Pi 4 and Pi 5.
