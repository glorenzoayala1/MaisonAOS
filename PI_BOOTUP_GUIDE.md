# Raspberry Pi Auto-Boot Setup

## Problem
The code is on the Pi but it's "just a standalone website" - it doesn't auto-start on boot.

## Solution
Enable the systemd services so everything launches automatically when the Pi powers on.

---

## Step 1: SSH into Your Pi

```bash
ssh pi@<your-pi-ip-address>
```

---

## Step 2: Navigate to Project

```bash
cd /home/pi/maison-mirror
```

Or wherever you cloned the code.

---

## Step 3: Run the Installation Script

This will install dependencies and set up all systemd services:

```bash
chmod +x install_pi.sh
./install_pi.sh
```

This script will:
- Install Python, Node.js, and system dependencies
- Create Python virtual environment
- Install Python packages (FastAPI, Porcupine, etc.)
- Build the React frontend
- Copy systemd service files to `/etc/systemd/system/`
- Enable all services to auto-start

---

## Step 4: Configure Auto-Login (Required for Kiosk Mode)

The kiosk service needs the desktop to be running. Configure auto-login:

```bash
sudo raspi-config
```

1. Select: **System Options**
2. Select: **Boot / Auto Login**
3. Select: **Desktop Autologin** (Desktop GUI, automatically logged in as 'pi' user)
4. Select: **Finish**

---

## Step 5: Add Shutdown Permissions

The mirror needs permission to shut down the Pi via voice commands:

```bash
sudo visudo
```

Add this line at the very end:

```
pi ALL=(ALL) NOPASSWD: /sbin/shutdown
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Step 6: Verify Services Are Enabled

Check that all services are enabled to auto-start:

```bash
sudo systemctl is-enabled maison-backend.service
sudo systemctl is-enabled maison-wake-word.service
sudo systemctl is-enabled maison-motion.service
sudo systemctl is-enabled maison-kiosk.service
```

All should return: `enabled`

If any show `disabled`, enable them:

```bash
sudo systemctl enable maison-backend.service
sudo systemctl enable maison-wake-word.service
sudo systemctl enable maison-motion.service
sudo systemctl enable maison-kiosk.service
```

---

## Step 7: Start Services (or Reboot)

### Option A: Start Services Now

```bash
sudo systemctl start maison-backend.service
sudo systemctl start maison-wake-word.service
sudo systemctl start maison-motion.service
```

The kiosk service will start automatically after reboot (it requires graphical desktop).

### Option B: Reboot (Recommended)

```bash
sudo reboot
```

After reboot, the Pi will:
1. Auto-login to desktop
2. Start backend API server
3. Start wake word listener (listens for "Hey Lorenzo")
4. Start motion sensor monitor
5. Launch Chromium in fullscreen kiosk mode showing the mirror

---

## Step 8: Check Service Status

After reboot, SSH back in and check services:

```bash
sudo systemctl status maison-backend.service
sudo systemctl status maison-wake-word.service
sudo systemctl status maison-motion.service
sudo systemctl status maison-kiosk.service
```

All should show: `active (running)`

---

## Step 9: View Logs (If Issues)

If any service fails, check the logs:

```bash
# Backend API logs
sudo journalctl -u maison-backend.service -f

# Wake word listener logs
sudo journalctl -u maison-wake-word.service -f

# Motion sensor logs
sudo journalctl -u maison-motion.service -f

# Kiosk (Chromium) logs
sudo journalctl -u maison-kiosk.service -f
```

Press `Ctrl+C` to stop viewing logs.

---

## Troubleshooting

### Backend service fails to start

**Check**: `.env` file exists with API keys

```bash
cat /home/pi/maison-mirror/mirror-server/app/.env
```

If missing, create it:

```bash
cd /home/pi/maison-mirror/mirror-server/app
nano .env
```

Paste your API keys:

```bash
OPENAI_API_KEY=your_key_here
PORCUPINE_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
NEWS_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
API_NINJAS_KEY=your_key_here
WAKE_WORD_PATH=wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn
```

Save (`Ctrl+X`, `Y`, `Enter`) and restart:

```bash
sudo systemctl restart maison-backend.service
```

---

### Wake word service fails

**Check**: Microphone is detected

```bash
arecord -l
```

You should see your M1 USB lavalier mic listed.

**Check**: Porcupine API key is valid

```bash
grep PORCUPINE_API_KEY /home/pi/maison-mirror/mirror-server/app/.env
```

---

### Kiosk mode doesn't launch

**Check**: Auto-login is enabled

```bash
cat /etc/lightdm/lightdm.conf | grep autologin-user
```

Should show: `autologin-user=pi`

If not, run `sudo raspi-config` and enable Desktop Autologin.

---

### Display stays off

**Check**: Motion sensor is working

```bash
sudo journalctl -u maison-motion.service -f
```

Wave your hand in front of the PIR sensor. You should see motion detected.

---

## What Services Do

| Service | Description | Auto-start |
|---------|-------------|------------|
| **maison-backend.service** | FastAPI server (port 8000) - serves widgets, handles API calls | Yes |
| **maison-wake-word.service** | Listens for "Hey Lorenzo" wake word using Porcupine | Yes |
| **maison-motion.service** | Monitors PIR motion sensor, wakes/sleeps display | Yes |
| **maison-kiosk.service** | Launches Chromium in fullscreen kiosk mode | Yes (after desktop login) |

---

## Hardware Connections

Make sure hardware is connected:

- **M1 USB Lavalier Mic**: Plugged into USB port
- **PIR Motion Sensor**: Connected to GPIO 17 (pin 11) and 3.3V power
- **TV Display**: Connected via HDMI

---

## Testing the Full Setup

After reboot and auto-start:

1. **Mirror displays on TV**: Kiosk mode working ✓
2. **Wave hand near PIR sensor**: Display wakes up ✓
3. **Say "Hey Lorenzo"**: Mirror starts listening (glowing border) ✓
4. **Ask a question**: Mirror responds with voice ✓

---

## Summary Commands

```bash
# SSH into Pi
ssh pi@<pi-ip>

# Navigate to project
cd /home/pi/maison-mirror

# Run installation (if not done yet)
./install_pi.sh

# Enable auto-login
sudo raspi-config
# → System Options → Boot/Auto Login → Desktop Autologin

# Add shutdown permissions
sudo visudo
# Add: pi ALL=(ALL) NOPASSWD: /sbin/shutdown

# Reboot to start everything
sudo reboot

# After reboot, check status
sudo systemctl status maison-backend.service
sudo systemctl status maison-wake-word.service
sudo systemctl status maison-motion.service
sudo systemctl status maison-kiosk.service
```

---

## Now It's a Bootup Product!

After following these steps:

✅ Power on the Pi → Everything starts automatically
✅ Mirror displays in fullscreen kiosk mode
✅ Wake word detection active
✅ Motion sensor controlling display sleep
✅ No manual intervention needed

Your Maison Mirror is now a complete **bootup product** that launches automatically when powered on! 🚀
