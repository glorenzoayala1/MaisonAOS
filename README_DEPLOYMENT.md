# Maison Mirror - Raspberry Pi 5 Deployment

Smart mirror with voice control, motion detection, and modular widgets.

## Quick Start for Raspberry Pi 5

### 1. Transfer Files to Pi

```bash
# From your Mac:
rsync -av --progress maison-mirror/ pi@<pi-ip>:/home/pi/maison-mirror/
```

### 2. Run Setup Script on Pi

```bash
ssh pi@<pi-ip>
cd /home/pi/maison-mirror
chmod +x setup_pi.sh
./setup_pi.sh
```

### 3. Build Frontend

```bash
cd mirror-client
npm install
npm run build
```

### 4. Configure Shutdown Permissions

```bash
sudo visudo
# Add at the end:
pi ALL=(ALL) NOPASSWD: /sbin/shutdown
```

### 5. Start Services

```bash
sudo systemctl start maison-backend.service
sudo systemctl start maison-wake-word.service
sudo systemctl start maison-motion.service
sudo reboot  # To start kiosk mode
```

## Features

### Widgets
- **Clock** - Time and date display
- **Weather** - Current conditions
- **Today** - Task list
- **Surf** - Surf conditions
- **News** - Multi-category news headlines
- **Stocks** - Stock quotes and charts
- **Quotes** - Inspirational quotes
- **Alarms** - Wake-up alarms with voice greetings

### Voice Control
- Wake word: **"Hey Maison"**
- Powered by OpenAI Whisper (STT) + GPT-4 + TTS
- Wake-word detection with Porcupine

### Motion Detection
- PIR sensor on GPIO 17
- Auto-wake on motion
- Auto-sleep after 5 minutes of inactivity

### Display Control
- Sleep mode (display off, services running)
- Power off button (safe shutdown)
- HDMI backlight control

## Hardware Setup

### PIR Motion Sensor
```
PIR → Raspberry Pi 5
VCC → Pin 1  (3.3V)
GND → Pin 6  (GND)
OUT → Pin 11 (GPIO 17)
```

### USB Microphone
Plug M1 USB lavalier mic into any USB port.

## Files Overview

### Scripts
- `motion_sensor.py` - PIR sensor monitor
- `wake_word_listener.py` - Voice wake-word detection
- `scripts/display_control.sh` - HDMI display control
- `setup_pi.sh` - Automated setup script
- `build_production.sh` - Build frontend for production

### Services (systemd)
- `maison-backend.service` - FastAPI backend
- `maison-wake-word.service` - Wake-word listener
- `maison-motion.service` - Motion sensor monitor
- `maison-kiosk.service` - Chromium kiosk display

### Configuration
- `mirror-server/app/.env` - API keys (OpenAI, News, Stocks, Quotes)
- `mirror-server/app/config.json` - Mirror configuration
- `mirror-client/src/config.ts` - Frontend config

## Documentation

See [PI_SETUP.md](PI_SETUP.md) for complete setup instructions, troubleshooting, and advanced configuration.

## Admin Panel

Access the admin panel from any device on your network:
- **URL**: `http://<pi-ip>:8000/admin`
- Configure widgets, categories, alarms, display settings
- Power off the mirror safely

## Development

### Run Locally (Mac/Linux)

**Backend:**
```bash
cd mirror-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd mirror-client
npm install
npm run dev
```

Access at `http://localhost:5173`

## API Endpoints

- `GET /` - Mirror display
- `GET /admin` - Admin panel
- `GET /api/config` - Get config
- `POST /api/config` - Update config
- `GET /api/news/top?categories=tech,business` - Get news
- `POST /api/system/shutdown` - Shutdown Pi
- `POST /zo/talk` - Voice interaction
- See `mirror-server/app/main.py` for full API

## News Categories

Select from:
- Technology
- Business
- Sports
- General (World)
- Health
- Science
- Entertainment

**Note**: NewsAPI free tier has 100 requests/day limit. The widget refreshes every hour. Selecting >3 categories may exceed limits.

## System Requirements

- Raspberry Pi 5 (4GB+ RAM recommended)
- Raspberry Pi OS 64-bit
- Python 3.10+
- Node.js 20+
- 32GB+ SD card

## License

Private project.

## Credits

Built with:
- FastAPI (backend)
- React + Vite (frontend)
- OpenAI API (voice + chat)
- Porcupine (wake-word)
- NewsAPI, Finnhub, API Ninjas (data)
