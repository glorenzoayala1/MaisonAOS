# GitHub Setup Guide - Deploy to Raspberry Pi

This guide shows you how to push your Maison Mirror code to GitHub and pull updates on your Raspberry Pi.

## Initial Setup (One Time)

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `maison-mirror` (or whatever you want)
3. **IMPORTANT**: Set to **Private** (your code has API keys!)
4. **Do NOT** initialize with README (you already have code)
5. Click **Create repository**

### 2. Add GitHub Remote (On Your Mac)

```bash
cd /Users/lorenzoayala/Desktop/maison-mirror

# Add GitHub as remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/maison-mirror.git

# Verify remote was added
git remote -v
```

### 3. Create .env.example File (Template for Others)

Before pushing, create a template `.env.example` file WITHOUT your actual API keys:

```bash
cd mirror-server/app

# Create example file
cat > .env.example << 'EOF'
# mirror-server/app/.env.example
# Copy this to .env and fill in your actual API keys

# OpenAI API (for voice system)
OPENAI_API_KEY=your_openai_key_here

# News API
NEWS_API_KEY=your_news_api_key_here

# Finnhub API (stocks)
FINNHUB_API_KEY=your_finnhub_key_here

# API Ninjas (quotes)
API_NINJAS_KEY=your_api_ninjas_key_here

# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_key_here

# Porcupine Wake Word Detection
# Get your API key from: https://console.picovoice.ai/
PORCUPINE_API_KEY=your_porcupine_key_here

# Custom Wake Word Path (optional)
# Download from: https://console.picovoice.ai/ppn
WAKE_WORD_PATH=wake_words/Hey-Lorenzo_en_raspberry-pi_v4_0_0.ppn
EOF
```

### 4. Commit and Push to GitHub

```bash
# Go to project root
cd /Users/lorenzoayala/Desktop/maison-mirror

# Add all files
git add .

# Commit
git commit -m "Initial commit: Maison Mirror v1.0

Features:
- Voice control with Hey Lorenzo wake word
- Multi-category news filtering
- All widgets (Clock, Weather, News, Stocks, Quotes, Alarms)
- PIR motion sensor integration
- Raspberry Pi 5 deployment scripts
- Glowing border effect when listening
"

# Push to GitHub (first time)
git push -u origin main
```

**Enter your GitHub credentials when prompted.**

---

## On Raspberry Pi - Initial Setup

### 1. Clone from GitHub

```bash
# SSH into Pi
ssh pi@<pi-ip>

# Clone your repository
cd /home/pi
git clone https://github.com/YOUR_USERNAME/maison-mirror.git

# Navigate to project
cd maison-mirror
```

### 2. Create Your .env File on Pi

The `.env` file is NOT in the repo (it's gitignored for security). You need to create it:

```bash
cd /home/pi/maison-mirror/mirror-server/app

# Copy example file
cp .env.example .env

# Edit with your actual API keys
nano .env
```

Paste your API keys and save (`Ctrl+X`, `Y`, `Enter`).

### 3. Run Installation

```bash
cd /home/pi/maison-mirror
chmod +x install_pi.sh
./install_pi.sh
```

---

## Updating Code on Raspberry Pi

When you make changes on your Mac and want to deploy to Pi:

### On Your Mac:

```bash
cd /Users/lorenzoayala/Desktop/maison-mirror

# Add changes
git add .

# Commit with description
git commit -m "Update: [describe your changes]"

# Push to GitHub
git push
```

### On Raspberry Pi:

```bash
# SSH into Pi
ssh pi@<pi-ip>

# Navigate to project
cd /home/pi/maison-mirror

# Pull latest changes
git pull

# If you changed backend Python code:
cd mirror-server
source venv/bin/activate
pip install -r requirements.txt  # If dependencies changed
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service

# If you changed frontend React code:
cd ../mirror-client
npm install  # If dependencies changed
npm run build
sudo systemctl restart maison-kiosk.service
```

---

## Quick Update Scripts

### Create Update Script for Pi

Save this as `update.sh` on your Pi:

```bash
#!/bin/bash
# Quick update script for Raspberry Pi

cd /home/pi/maison-mirror

echo "Pulling latest changes from GitHub..."
git pull

echo "Updating backend..."
cd mirror-server
source venv/bin/activate
pip install -r requirements.txt

echo "Updating frontend..."
cd ../mirror-client
npm install
npm run build

echo "Restarting services..."
sudo systemctl restart maison-backend.service
sudo systemctl restart maison-wake-word.service
sudo systemctl restart maison-kiosk.service

echo "✓ Update complete!"
sudo systemctl status maison-backend.service --no-pager
```

Make it executable:
```bash
chmod +x /home/pi/maison-mirror/update.sh
```

Then you can update with just:
```bash
./update.sh
```

---

## Important Files NOT in Git

These files are excluded from git (in `.gitignore`) for security:

- ✋ `mirror-server/app/.env` - Your API keys
- ✋ `mirror-server/app/config.json` - Mirror configuration
- ✋ `mirror-server/wake_words/*.ppn` - Wake word files (large)
- ✋ `node_modules/` - Dependencies
- ✋ `mirror-client/dist/` - Build output

**You need to manually sync these or recreate them on the Pi.**

---

## Workflow Summary

### Development Flow:

1. **Edit code on Mac** → Save changes
2. **Commit to git** → `git add . && git commit -m "description"`
3. **Push to GitHub** → `git push`
4. **Pull on Pi** → SSH to Pi, `git pull`
5. **Restart services** → `./update.sh`

---

## GitHub Authentication

### Using HTTPS (Easiest):

When you push/pull, GitHub will ask for credentials:
- **Username**: Your GitHub username
- **Password**: **Personal Access Token** (NOT your password!)

**Create a token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scopes: `repo` (full control)
4. Copy token and use it as password

### Using SSH (Advanced):

Set up SSH keys for password-less authentication:

```bash
# Generate SSH key on Mac
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

Then change remote to SSH:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/maison-mirror.git
```

---

## Security Best Practices

✅ **DO:**
- Keep `.env` files OUT of git (already in .gitignore)
- Use `.env.example` as template
- Keep repo **Private** on GitHub
- Use Personal Access Tokens (not password)

❌ **DON'T:**
- Commit API keys to GitHub
- Make repo public
- Share your `.env` file

---

## Troubleshooting

### "Permission denied (publickey)"
- Use HTTPS instead of SSH
- Or set up SSH keys properly

### ".env file missing on Pi"
- Create it manually: `cp .env.example .env`
- Add your actual API keys

### "git pull" conflicts
```bash
# Stash local changes
git stash

# Pull updates
git pull

# Reapply changes
git stash pop
```

---

## Summary

**One-time setup:**
1. Create GitHub repo (private)
2. Add remote: `git remote add origin https://github.com/...`
3. Push: `git push -u origin main`
4. Clone on Pi: `git clone https://github.com/...`
5. Create `.env` on Pi with API keys

**Regular updates:**
1. Mac: `git add . && git commit -m "..." && git push`
2. Pi: `git pull && ./update.sh`

That's it! Your Maison Mirror is now synced via GitHub. 🚀
