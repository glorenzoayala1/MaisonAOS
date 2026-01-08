#!/bin/bash
# Quick Setup Script for Maison Mirror on Raspberry Pi 5
# Run this script after transferring files to /home/pi/maison-mirror

set -e

echo "============================================"
echo " Maison Mirror - Raspberry Pi Setup"
echo "============================================"
echo ""

# Check if running on Pi
if [ ! -f /proc/device-tree/model ]; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Ensure we're in the right directory
if [ ! -f "mirror-server/app/main.py" ]; then
    echo "❌ Error: Please run this script from /home/pi/maison-mirror/"
    exit 1
fi

echo "[1/6] Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-rpi.gpio
sudo apt install -y portaudio19-dev python3-pyaudio cec-utils

echo ""
echo "[2/6] Setting up Python virtual environment..."
cd mirror-server
python3 -m venv venv
source venv/bin/activate

echo ""
echo "[3/6] Installing Python packages..."
pip install --upgrade pip
pip install fastapi uvicorn pydantic requests python-dotenv
pip install openai sounddevice soundfile pvporcupine
pip install RPi.GPIO

echo ""
echo "[4/6] Checking .env file..."
if [ ! -f "app/.env" ]; then
    echo "❌ Error: app/.env file not found!"
    echo "Please create app/.env with your API keys before continuing."
    exit 1
else
    echo "✓ .env file found"
fi

echo ""
echo "[5/6] Making scripts executable..."
chmod +x scripts/display_control.sh
chmod +x motion_sensor.py
chmod +x wake_word_listener.py

echo ""
echo "[6/6] Installing systemd services..."
cd systemd
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
echo "============================================"
echo " ✓ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Build frontend: cd ../mirror-client && npm install && npm run build"
echo "  2. Configure shutdown permissions: sudo visudo"
echo "     Add: pi ALL=(ALL) NOPASSWD: /sbin/shutdown"
echo "  3. Start services: sudo systemctl start maison-backend.service"
echo "  4. Start all services: sudo systemctl start maison-wake-word.service maison-motion.service"
echo "  5. Reboot to start kiosk: sudo reboot"
echo ""
echo "To check status: sudo systemctl status maison-backend.service"
echo "View logs: sudo journalctl -u maison-backend.service -f"
echo ""
