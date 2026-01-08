#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "🔪 Killing old mirror processes (if any)..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite"                 2>/dev/null || true
pkill -f "zo_listener.py"       2>/dev/null || true

echo "🚀 Starting Maison Mirror dev stack..."

# 1) Backend
(
  cd mirror-server
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# 2) Frontend
(
  cd mirror-client
  npm run dev
) &
FRONTEND_PID=$!

# 3) Wake-word listener (Porcupine)
(
  cd mirror-server
  python zo_listener.py
) &
LISTENER_PID=$!

echo "✅ Backend PID:   $BACKEND_PID"
echo "✅ Frontend PID:  $FRONTEND_PID"
echo "✅ Listener PID:  $LISTENER_PID"
echo "Don't run zo_listener.py manually now, it's already running."

wait
