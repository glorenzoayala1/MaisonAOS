#!/bin/bash
# Quick test script for "Hey Lorenzo" wake word detection

echo "============================================"
echo " Testing 'Hey Lorenzo' Wake Word Detection"
echo "============================================"
echo ""

# Check if in virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not active. Activating..."
    source venv/bin/activate || {
        echo "❌ Error: Virtual environment not found"
        echo "Run: python3 -m venv venv"
        exit 1
    }
fi

# Check if dependencies are installed
echo "[1/4] Checking dependencies..."
python3 -c "import pvporcupine" 2>/dev/null || {
    echo "⚠️  pvporcupine not installed. Installing..."
    pip install pvporcupine
}

python3 -c "import sounddevice" 2>/dev/null || {
    echo "⚠️  sounddevice not installed. Installing..."
    pip install sounddevice
}

python3 -c "import dotenv" 2>/dev/null || {
    echo "⚠️  python-dotenv not installed. Installing..."
    pip install python-dotenv
}

# Check .env file
echo ""
echo "[2/4] Checking .env file..."
if [ ! -f "app/.env" ]; then
    echo "❌ Error: app/.env file not found"
    exit 1
fi

if ! grep -q "PORCUPINE_API_KEY" app/.env; then
    echo "❌ Error: PORCUPINE_API_KEY not found in .env"
    exit 1
fi

echo "✓ .env file found with PORCUPINE_API_KEY"

# Check wake word file
echo ""
echo "[3/4] Checking wake word file..."
WAKE_WORD_PATH=$(grep "WAKE_WORD_PATH" app/.env | cut -d '=' -f2)
if [ ! -f "$WAKE_WORD_PATH" ]; then
    echo "❌ Error: Wake word file not found at: $WAKE_WORD_PATH"
    echo ""
    echo "Using built-in 'jarvis' keyword instead"
    echo "To create custom wake word:"
    echo "  1. Go to https://console.picovoice.ai/ppn"
    echo "  2. Train 'Hey Lorenzo' wake word"
    echo "  3. Download .ppn file"
    echo "  4. Place in: $WAKE_WORD_PATH"
    echo ""
else
    echo "✓ Wake word file found: $WAKE_WORD_PATH"
fi

# List audio devices
echo ""
echo "[4/4] Available audio devices:"
python3 -c "import sounddevice as sd; print(sd.query_devices())"

echo ""
echo "============================================"
echo " Starting Wake Word Listener..."
echo "============================================"
echo ""
echo "Say: 'Hey Lorenzo'"
echo "Press Ctrl+C to stop"
echo ""

# Run the wake word listener
python3 wake_word_listener.py
