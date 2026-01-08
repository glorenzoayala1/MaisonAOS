# Raspberry Pi 5 Setup Guide for Maison Mirror

This guide will help you set up the Maison Mirror on a Raspberry Pi 5 with PIR motion sensor and USB microphone.

## Hardware Requirements

- **Raspberry Pi 5** (4GB or 8GB recommended)
- **PIR Motion Sensor** (HC-SR501 or similar)
- **M1 USB Lavalier Microphone** (or compatible USB mic)
- **Display** (TV or monitor with HDMI)
- **MicroSD Card** (32GB+ recommended)
- **Power Supply** (Official Pi 5 power supply recommended)
- **Jumper Wires** (for PIR sensor connection)

## Hardware Setup

### PIR Motion Sensor Wiring

Connect the PIR sensor to your Raspberry Pi 5:

```
PIR Sensor → Raspberry Pi 5
VCC        → Pin 1  (3.3V)
GND        → Pin 6  (Ground)
OUT        → Pin 11 (GPIO 17)
```

### USB Microphone

Simply plug the M1 USB lavalier mic into any USB port on the Pi 5.

### Display Connection

Connect your display via HDMI.

---

## Software Setup

### Step 1: Prepare Raspberry Pi OS

1. **Flash Raspberry Pi OS (64-bit) to SD card**
   - Use Raspberry Pi Imager: https://www.raspberrypi.com/software/
   - Choose: **Raspberry Pi OS (64-bit)** with desktop
   - Configure WiFi and enable SSH in advanced settings

2. **Boot the Pi and update system**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

### Step 2: Install System Dependencies

```bash
# Python and build tools
sudo apt install -y python3 python3-pip python3-venv

# Node.js and npm (for frontend build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# GPIO library for motion sensor
sudo apt install -y python3-rpi.gpio

# Audio tools
sudo apt install -y portaudio19-dev python3-pyaudio

# Display control tools
sudo apt install -y cec-utils

# Git (if not installed)
sudo apt install -y git
```

### Step 3: Transfer Maison Mirror Code

**Option A: Clone from Git (if you have a repo)**
```bash
cd /home/pi
git clone <your-repo-url> maison-mirror
cd maison-mirror
```

**Option B: Transfer from your Mac**
```bash
# On your Mac:
cd ~/Desktop
rsync -av --progress maison-mirror/ pi@<pi-ip-address>:/home/pi/maison-mirror/

# SSH into Pi:
ssh pi@<pi-ip-address>
cd /home/pi/maison-mirror
```

### Step 4: Setup Backend (Python)

```bash
cd /home/pi/maison-mirror/mirror-server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install fastapi uvicorn pydantic requests python-dotenv
pip install openai sounddevice soundfile pvporcupine
pip install RPi.GPIO

# Verify .env file exists with API keys
cat app/.env
# Should contain:
# OPENAI_API_KEY=sk-...
# NEWS_API_KEY=...
# FINNHUB_API_KEY=...
# API_NINJAS_KEY=...
# PORCUPINE_API_KEY=...
```

### Step 4.5: Setup Custom Wake Word "Hey Lorenzo" (Optional but Recommended)

**Get Porcupine API Key:**
1. Go to https://console.picovoice.ai/
2. Sign up for free account
3. Copy your Access Key
4. Add to `.env`: `PORCUPINE_API_KEY=your_key_here`

**Create Custom Wake Word:**
1. Go to https://console.picovoice.ai/ppn
2. Click "Train a Wake Word"
3. Enter: **"Hey Lorenzo"**
4. Select platform: **Raspberry Pi**
5. Train model (takes a few minutes)
6. Download the `.ppn` file (e.g., `hey-lorenzo_en_raspberry-pi_v3_0_0.ppn`)
7. Place in: `mirror-server/wake_words/`
8. Update `.env`: `WAKE_WORD_PATH=wake_words/hey-lorenzo_en_raspberry-pi_v3_0_0.ppn`

**Note**: If you skip this step, the system will use the built-in "jarvis" wake word instead.
See `mirror-server/wake_words/README.md` for detailed instructions.

### Step 5: Setup Frontend (React)

```bash
cd /home/pi/maison-mirror/mirror-client

# Install dependencies
npm install

# Build for production
npm run build

# Production files will be in: dist/
```

### Step 6: Test the Services

**Test Backend:**
```bash
cd /home/pi/maison-mirror/mirror-server
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open browser: `http://localhost:8000`

**Test Wake Word Listener:**
```bash
cd /home/pi/maison-mirror/mirror-server
source venv/bin/activate

# Use the test script (recommended)
./test_wake_word.sh

# Or run directly
python3 wake_word_listener.py
```

Say "Hey Lorenzo" to test. The script will show available audio devices and confirm the wake word file is loaded.

**Test Motion Sensor:**
```bash
cd /home/pi/maison-mirror/mirror-server
source venv/bin/activate
sudo python3 motion_sensor.py
```

Wave in front of the PIR sensor to test.

---

## Production Deployment (Auto-Start on Boot)

### Step 7: Install Systemd Services

```bash
cd /home/pi/maison-mirror/mirror-server/systemd

# Copy service files to systemd directory
sudo cp maison-backend.service /etc/systemd/system/
sudo cp maison-wake-word.service /etc/systemd/system/
sudo cp maison-motion.service /etc/systemd/system/
sudo cp maison-kiosk.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload
```

### Step 8: Enable and Start Services

```bash
# Enable services to start on boot
sudo systemctl enable maison-backend.service
sudo systemctl enable maison-wake-word.service
sudo systemctl enable maison-motion.service
sudo systemctl enable maison-kiosk.service

# Start services now
sudo systemctl start maison-backend.service
sudo systemctl start maison-wake-word.service
sudo systemctl start maison-motion.service
sudo systemctl start maison-kiosk.service
```

### Step 9: Check Service Status

```bash
# Check all services
sudo systemctl status maison-backend.service
sudo systemctl status maison-wake-word.service
sudo systemctl status maison-motion.service
sudo systemctl status maison-kiosk.service

# View logs
sudo journalctl -u maison-backend.service -f
sudo journalctl -u maison-wake-word.service -f
sudo journalctl -u maison-motion.service -f
```

### Step 10: Configure Shutdown Permissions

To allow the web interface to shut down the Pi:

```bash
# Edit sudoers file
sudo visudo

# Add this line at the end:
pi ALL=(ALL) NOPASSWD: /sbin/shutdown
```

This allows the "Power Off Mirror" button in the admin panel to work.

---

## Kiosk Mode Configuration

### Auto-Login to Desktop

```bash
# Enable auto-login
sudo raspi-config
# Navigate to: System Options → Boot / Auto Login → Desktop Autologin
```

### Hide Mouse Cursor (Optional)

```bash
sudo apt install -y unclutter
# Add to autostart:
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/unclutter.desktop << EOF
[Desktop Entry]
Type=Application
Exec=unclutter -idle 0.1 -root
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Unclutter
EOF
```

---

## Usage

### Accessing the Mirror

- **Mirror Display**: `http://localhost:8000/` (auto-opens in kiosk mode)
- **Admin Panel**: `http://localhost:8000/admin` (from another device on same network)
- **From Other Devices**: `http://<pi-ip-address>:8000/admin`

### Voice Commands

1. Say: **"Hey Maison"** (wake word)
2. Wait for response tone
3. Ask your question (e.g., "What's the weather?", "What time is it?")

### Motion Sensor Behavior

- **Motion Detected**: Mirror wakes up (display turns on)
- **No Motion for 5 Minutes**: Mirror goes to sleep (display turns off)
- Background services continue running

### Power Management

- **Sleep Mode**: Press "Sleep Mode" button in admin panel
- **Power Off**: Press "Power Off Mirror" button in admin panel (shuts down Pi)

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
sudo journalctl -u maison-backend.service -n 50

# Common issues:
# - Missing .env file
# - Wrong Python path in service file
# - Port 8000 already in use
```

### Wake Word Not Working
```bash
# Check microphone
arecord -l

# Test recording
arecord -d 3 test.wav
aplay test.wav

# Check service logs
sudo journalctl -u maison-wake-word.service -n 50
```

### Motion Sensor Not Responding
```bash
# Test GPIO
gpio readall

# Check wiring (GPIO 17)
# Check service logs
sudo journalctl -u maison-motion.service -n 50
```

### Display Won't Sleep/Wake
```bash
# Test display control
/home/pi/maison-mirror/mirror-server/scripts/display_control.sh off
/home/pi/maison-mirror/mirror-server/scripts/display_control.sh on

# Make script executable
chmod +x /home/pi/maison-mirror/mirror-server/scripts/display_control.sh
```

### Kiosk Won't Launch
```bash
# Check X display
echo $DISPLAY

# Test Chromium manually
chromium-browser --kiosk http://localhost:8000

# Check service logs
sudo journalctl -u maison-kiosk.service -n 50
```

---

## Updating the Mirror

### Update Backend Code
```bash
cd /home/pi/maison-mirror/mirror-server
git pull  # or transfer new files
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service
```

### Update Frontend
```bash
cd /home/pi/maison-mirror/mirror-client
npm run build
# Refresh browser (Ctrl+Shift+R in kiosk or just reboot)
sudo systemctl restart maison-kiosk.service
```

---

## Performance Tips

1. **Disable Bluetooth** (if not used):
   ```bash
   sudo systemctl disable bluetooth
   ```

2. **Reduce GPU Memory** (if not gaming):
   ```bash
   sudo raspi-config
   # Performance Options → GPU Memory → 64
   ```

3. **Use Lite OS** (no desktop) if only using kiosk mode

4. **Monitor Temperature**:
   ```bash
   vcgencmd measure_temp
   ```

---

## Security Notes

- Change default Pi password: `passwd`
- Use firewall if exposed to internet:
  ```bash
  sudo apt install ufw
  sudo ufw allow 8000/tcp
  sudo ufw enable
  ```
- Keep system updated: `sudo apt update && sudo apt upgrade`

---

## Support

For issues, check:
- Service logs: `sudo journalctl -u maison-*.service`
- System logs: `sudo journalctl -n 100`
- Backend logs: Check console output when running manually

---

**Congratulations! Your Maison Mirror is ready to use!** 🎉
