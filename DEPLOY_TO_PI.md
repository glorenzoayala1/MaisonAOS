# Deploy to Raspberry Pi - Quick Start

## Your Code is Now on GitHub!

Repository: https://github.com/glorenzoayala1/MaisonAOS

---

## On Your Raspberry Pi: Complete Setup

### 1. SSH into Pi

```bash
ssh pi@<your-pi-ip-address>
```

### 2. Clone Code from GitHub

```bash
cd /home/pi
git clone https://github.com/glorenzoayala1/MaisonAOS.git maison-mirror
cd maison-mirror
```

### 3. Configure API Keys (Two Options)

**Option A: Use Admin Panel (Recommended - After Installation)**

You can add API keys through the web interface after the mirror is running:

1. Complete installation first (step 4)
2. Open browser: `http://<pi-ip>:8000/admin`
3. Scroll to "API Keys" section
4. Enter your API keys in the password-masked fields
5. Click "Save Configuration"
6. Restart services: `sudo systemctl restart maison-backend.service maison-wake-word.service`

**Option B: Create .env File Now (Optional)**

```bash
cd mirror-server/app
nano .env
```

**Paste this template (replace with your actual API keys):**

```
OPENAI_API_KEY=your_openai_api_key_here
NEWS_API_KEY=your_news_api_key_here
FINNHUB_API_KEY=your_finnhub_api_key_here
API_NINJAS_KEY=your_api_ninjas_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
PORCUPINE_API_KEY=your_porcupine_api_key_here
WAKE_WORD_PATH=wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn
```

Save: `Ctrl+X`, `Y`, `Enter`

**Note:** Keys entered through the admin panel are saved to config.json and take precedence over .env file.

### 4. Run Installation Script

```bash
cd /home/pi/maison-mirror
chmod +x install_pi.sh
./install_pi.sh
```

This installs everything: Python, Node.js, dependencies, builds frontend, and sets up auto-boot services.

### 5. Configure Auto-Login (for Kiosk Mode)

```bash
sudo raspi-config
```

- Select: **System Options**
- Select: **Boot / Auto Login**
- Select: **Desktop Autologin**
- Select: **Finish**

### 6. Add Shutdown Permissions

```bash
sudo visudo
```

Add at the very end:

```
pi ALL=(ALL) NOPASSWD: /sbin/shutdown
```

Save: `Ctrl+X`, `Y`, `Enter`

### 7. Reboot!

```bash
sudo reboot
```

---

## What Happens After Reboot

✅ Pi auto-logs into desktop
✅ Backend API server starts (port 8000)
✅ Wake word listener starts (listens for "Hey Lorenzo")
✅ Motion sensor monitor starts
✅ Chromium launches fullscreen showing mirror

**Your Pi is now a bootup smart mirror product!**

---

## Testing

1. **Mirror displays on TV** - Working ✓
2. **Wave hand near PIR sensor** - Display wakes ✓
3. **Say "Hey Lorenzo"** - Glowing border appears ✓
4. **Ask "What's the weather?"** - Voice responds ✓

---

## Updating Code Later

**On Your Mac:**

```bash
cd /Users/lorenzoayala/Desktop/maison-mirror
git add .
git commit -m "Update: describe changes"
git push
```

**On Raspberry Pi:**

```bash
ssh pi@<pi-ip>
cd /home/pi/maison-mirror
git pull

# If backend changed:
cd mirror-server && source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service

# If frontend changed:
cd ../mirror-client && npm install && npm run build
sudo systemctl restart maison-kiosk.service
```

---

## Checking Service Status

```bash
sudo systemctl status maison-backend.service
sudo systemctl status maison-wake-word.service
sudo systemctl status maison-motion.service
sudo systemctl status maison-kiosk.service
```

All should show: `active (running)`

---

## View Logs

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

---

That's it! Your smart mirror is now a complete bootup product. 🚀
