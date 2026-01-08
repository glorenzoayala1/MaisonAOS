#!/bin/bash
# Complete Installation Script for Raspberry Pi 5
# Run this after uploading code to /home/pi/maison-mirror

set -e

echo "============================================"
echo " Maison Mirror - Raspberry Pi Installation"
echo "============================================"
echo ""

# Check we're in the right directory
if [ ! -f "mirror-server/app/main.py" ]; then
    echo "❌ Error: Run this from /home/pi/maison-mirror/"
    exit 1
fi

echo "[1/8] Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-rpi.gpio
sudo apt install -y portaudio19-dev python3-pyaudio cec-utils
sudo apt install -y nodejs npm

echo ""
echo "[2/8] Setting up Python backend..."
cd mirror-server
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "[3/8] Checking .env configuration..."
if [ ! -f "app/.env" ]; then
    echo "❌ Error: app/.env not found!"
    echo "Please create app/.env with your API keys"
    exit 1
fi

# Check for required API keys
for key in OPENAI_API_KEY PORCUPINE_API_KEY OPENWEATHER_API_KEY; do
    if ! grep -q "$key=" app/.env; then
        echo "⚠️  Warning: $key not found in .env"
    else
        echo "✓ $key found"
    fi
done

echo ""
echo "[4/8] Testing wake word setup..."
if [ -f "./test_wake_word.sh" ]; then
    chmod +x test_wake_word.sh
    echo "✓ Wake word test script ready"
    echo "  Run: ./test_wake_word.sh to test microphone"
fi

# Check wake word file
WAKE_WORD_PATH=$(grep "WAKE_WORD_PATH" app/.env | cut -d '=' -f2 | tr -d ' ')
if [ -f "$WAKE_WORD_PATH" ]; then
    echo "✓ Wake word file found: $WAKE_WORD_PATH"
else
    echo "⚠️  Wake word file not found: $WAKE_WORD_PATH"
    echo "   System will use built-in 'jarvis' keyword"
fi

echo ""
echo "[5/8] Making scripts executable..."
chmod +x wake_word_listener.py
chmod +x motion_sensor.py
chmod +x scripts/display_control.sh

echo ""
echo "[6/8] Building frontend..."
cd ../mirror-client
npm install
npm run build
echo "✓ Frontend built to: mirror-client/dist/"

echo ""
echo "[7/8] Installing systemd services..."
cd ../mirror-server/systemd
sudo cp maison-backend.service /etc/systemd/system/
sudo cp maison-wake-word.service /etc/systemd/system/
sudo cp maison-motion.service /etc/systemd/system/
sudo cp maison-kiosk.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable maison-backend.service
sudo systemctl enable maison-wake-word.service
sudo systemctl enable maison-motion.service
sudo systemctl enable maison-kiosk.service

echo ""
echo "[8/8] Setting up sudo permissions for shutdown..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "Run: sudo visudo"
echo "Add this line at the end:"
echo "  pi ALL=(ALL) NOPASSWD: /sbin/shutdown"
echo ""

echo "============================================"
echo " ✓ Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure sudo for shutdown (see above)"
echo ""
echo "2. Test microphone and wake word:"
echo "   cd /home/pi/maison-mirror/mirror-server"
echo "   source venv/bin/activate"
echo "   ./test_wake_word.sh"
echo ""
echo "3. Start services:"
echo "   sudo systemctl start maison-backend.service"
echo "   sudo systemctl start maison-wake-word.service"
echo "   sudo systemctl start maison-motion.service"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status maison-backend.service"
echo "   sudo systemctl status maison-wake-word.service"
echo ""
echo "5. View logs:"
echo "   sudo journalctl -u maison-wake-word.service -f"
echo ""
echo "6. Reboot to start kiosk mode:"
echo "   sudo reboot"
echo ""
echo "Access mirror at: http://localhost:8000"
echo "Access admin at: http://<pi-ip>:8000/admin"
echo ""
