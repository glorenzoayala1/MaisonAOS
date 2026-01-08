#!/bin/bash
# Production Build Script for Maison Mirror
# Builds the React frontend for production deployment

set -e

echo "============================================"
echo " Maison Mirror - Production Build"
echo "============================================"
echo ""

# Navigate to client directory
cd mirror-client

echo "[1/3] Installing dependencies..."
npm install

echo ""
echo "[2/3] Building production bundle..."
npm run build

echo ""
echo "[3/3] Build complete!"
echo ""
echo "✓ Production files are in: mirror-client/dist/"
echo ""
echo "Next steps for Raspberry Pi deployment:"
echo "  1. Copy the entire maison-mirror folder to /home/pi/"
echo "  2. Run the setup script on the Pi: ./setup_pi.sh"
echo ""
