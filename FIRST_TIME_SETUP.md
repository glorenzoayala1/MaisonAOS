# First Time Setup - Plug and Play Guide

## What You Need

**Hardware:**
- Raspberry Pi 5 (with microSD card and Raspberry Pi OS installed)
- Monitor/TV (connected via HDMI)
- Keyboard and mouse (USB)
- M1 USB lavalier microphone
- PIR motion sensor (connected to GPIO 17)
- Power supply

**Before You Start:**
- Pi should be running Raspberry Pi OS (64-bit recommended)
- Pi should be connected to internet (WiFi or Ethernet)

---

## Step-by-Step Setup (First Boot)

### 1. Initial Pi Setup

**Power on the Pi connected to monitor with keyboard/mouse.**

If this is your first time booting, complete the Raspberry Pi OS initial setup:
- Set country/language/timezone
- Set username: `pi` (recommended) or your choice
- Set password
- Connect to WiFi
- Update software if prompted

**Open Terminal** (black icon at top of screen or Menu → Accessories → Terminal)

### 2. Install Git

```bash
sudo apt update
sudo apt install -y git
```

### 3. Clone the Mirror Code from GitHub

```bash
cd /home/pi
git clone https://github.com/glorenzoayala1/MaisonAOS.git maison-mirror
cd maison-mirror
```

### 4. Run the Installation Script

This installs everything automatically (Python, Node.js, all dependencies, builds the app):

```bash
chmod +x install_pi.sh
./install_pi.sh
```

**This takes 10-20 minutes.** It will:
- Install Python 3, Node.js, and system packages
- Set up Python virtual environment
- Install backend dependencies
- Build the React frontend
- Install systemd services for auto-start

**Wait for it to complete.** You'll see: `✓ Installation Complete!`

### 5. Configure API Keys

**Two options:**

**Option A: Use the Web Interface (Easier)**

Skip this step for now. You'll add keys through the admin panel after the mirror is running.

**Option B: Create .env File Now**

```bash
cd /home/pi/maison-mirror/mirror-server/app
nano .env
```

Paste your API keys:

```
OPENAI_API_KEY=your_openai_key_here
NEWS_API_KEY=your_news_api_key_here
FINNHUB_API_KEY=your_finnhub_key_here
API_NINJAS_KEY=your_api_ninjas_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
PORCUPINE_API_KEY=your_porcupine_key_here
WAKE_WORD_PATH=wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn
```

Save: `Ctrl+X`, `Y`, `Enter`

### 6. Configure Auto-Login (Required for Auto-Boot)

```bash
sudo raspi-config
```

Navigate using arrow keys:
1. Select: **1 System Options**
2. Select: **S5 Boot / Auto Login**
3. Select: **B4 Desktop Autologin** (Desktop GUI, automatically logged in as 'pi' user)
4. Select: **Finish**
5. Select: **Yes** to reboot (or select **No** and continue to step 7 first)

### 7. Add Shutdown Permissions (Optional - for voice commands)

This lets the mirror shut down the Pi when you say "shut down mirror":

```bash
sudo visudo
```

Arrow down to the very bottom of the file and add this line:

```
pi ALL=(ALL) NOPASSWD: /sbin/shutdown
```

Save: `Ctrl+X`, `Y`, `Enter`

### 8. Reboot to Start Auto-Boot Mode

```bash
sudo reboot
```

---

## What Happens After Reboot (Auto-Boot Mode)

After the Pi reboots:

1. ✅ **Automatically logs into desktop**
2. ✅ **Backend API server starts** (port 8000)
3. ✅ **Wake word listener starts** (listens for "Hey Lorenzo")
4. ✅ **Motion sensor monitor starts** (wakes/sleeps display)
5. ✅ **Chromium launches in fullscreen** showing the mirror

**The mirror displays automatically!**

---

## Configure API Keys (If You Skipped Step 5)

If you didn't add API keys yet:

1. **Press `F11`** on keyboard to exit fullscreen
2. **Edit URL bar** to go to: `http://localhost:8000/admin`
3. **Scroll to "API Keys" section**
4. **Enter your API keys** in the password fields
5. **Click "Save Configuration"**
6. **Restart services:**

```bash
# Open terminal (Ctrl+Alt+T)
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service
```

7. **Refresh browser** (F5) or click back to mirror: `http://localhost:8000`
8. **Press F11** to go fullscreen again

---

## Troubleshooting

### Mirror doesn't appear after reboot

**Check services are running:**

```bash
sudo systemctl status maison-backend.service
sudo systemctl status maison-kiosk.service
```

Both should show `active (running)` in green.

**If backend is not running:**

```bash
# View logs
sudo journalctl -u maison-backend.service -n 50

# Try restarting
sudo systemctl restart maison-backend.service
```

**If kiosk is not running:**

Make sure auto-login is enabled (step 6).

```bash
sudo systemctl restart maison-kiosk.service
```

### Wake word not detecting "Hey Lorenzo"

**Check microphone is detected:**

```bash
arecord -l
```

You should see your M1 USB mic listed.

**Check wake word service:**

```bash
sudo systemctl status maison-wake-word.service

# View logs
sudo journalctl -u maison-wake-word.service -f
```

Say "Hey Lorenzo" - you should see detection logs.

### Display stays off

**Check motion sensor service:**

```bash
sudo systemctl status maison-motion.service

# View logs
sudo journalctl -u maison-motion.service -f
```

Wave hand near PIR sensor - you should see motion detected.

### How to exit fullscreen and get to terminal

- **Exit fullscreen:** Press `F11`
- **Open terminal:** Press `Ctrl+Alt+T` or click terminal icon at top

---

## Manual Control

### Start/Stop Services Manually

```bash
# Start all services
sudo systemctl start maison-backend.service
sudo systemctl start maison-wake-word.service
sudo systemctl start maison-motion.service
sudo systemctl start maison-kiosk.service

# Stop all services
sudo systemctl stop maison-backend.service
sudo systemctl stop maison-wake-word.service
sudo systemctl stop maison-motion.service
sudo systemctl stop maison-kiosk.service

# Restart backend (e.g., after updating API keys)
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service
```

### View Logs

```bash
# Backend logs
sudo journalctl -u maison-backend.service -f

# Wake word logs
sudo journalctl -u maison-wake-word.service -f

# Motion sensor logs
sudo journalctl -u maison-motion.service -f

# Kiosk logs
sudo journalctl -u maison-kiosk.service -f
```

Press `Ctrl+C` to stop viewing logs.

### Access Mirror Pages

- **Mirror Display:** `http://localhost:8000`
- **Admin Panel:** `http://localhost:8000/admin`
- **Config Screen:** `http://localhost:8000/config`

---

## Network Access (From Other Devices)

**Find Pi's IP address:**

```bash
hostname -I
```

**Access from phone/laptop on same network:**

- Mirror: `http://<pi-ip>:8000`
- Admin: `http://<pi-ip>:8000/admin`

---

## Summary

**One-time setup:**
1. Clone from GitHub
2. Run `./install_pi.sh`
3. Configure auto-login (`sudo raspi-config`)
4. Add shutdown permissions (`sudo visudo`)
5. Reboot

**Result:**
- Pi boots directly into mirror mode
- No monitor/keyboard needed after setup
- Wake word detection active
- Motion sensor controlling display
- Just plug in power and it works!

Your Maison Mirror is now a complete plug-and-play smart mirror! 🚀
