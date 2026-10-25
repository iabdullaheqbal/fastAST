#!/usr/bin/env bash
set -e

# FastAST Lens Development Launcher
# Starts FastAST Python HTTP API Server (:4200) and the React/Three.js Vite UI (:5173)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

if [ -x "$REPO_ROOT/.venv/bin/python" ]; then
    PYTHON_BIN="$REPO_ROOT/.venv/bin/python"
else
    PYTHON_BIN="python3"
fi

echo "=========================================================="
echo "  FastAST Lens — Codebase Memory & 3D Graph UI"
echo "=========================================================="

# Check if .fastast.db exists, otherwise index
if [ ! -f ".fastast.db" ]; then
    echo "Initializing FastAST index in $REPO_ROOT..."
    PYTHONPATH=python "$PYTHON_BIN" -m fastast.cli index . || true
fi

# Function to clean up background processes on Ctrl+C
cleanup() {
    echo ""
    echo "Shutting down FastAST Lens services..."
    if [ -n "$API_PID" ]; then
        kill "$API_PID" 2>/dev/null || true
    fi
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti :4200 | xargs kill -9 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Clean up any stale process on port 4200 before starting
if command -v lsof >/dev/null 2>&1 && lsof -ti :4200 >/dev/null 2>&1; then
    echo "Port 4200 is currently in use. Cleaning up stale process..."
    lsof -ti :4200 | xargs kill -9 2>/dev/null || true
    sleep 0.5
elif command -v fuser >/dev/null 2>&1 && fuser 4200/tcp >/dev/null 2>&1; then
    echo "Port 4200 is currently in use. Cleaning up stale process..."
    fuser -k 4200/tcp 2>/dev/null || true
    sleep 0.5
fi

# 1. Start FastAST HTTP API Server on port 4200
echo "Starting FastAST API Server on http://127.0.0.1:4200..."
PYTHONPATH=python "$PYTHON_BIN" -m fastast.cli serve --port 4200 --host 127.0.0.1 &
API_PID=$!

sleep 1

# 2. Start Vite UI on port 5173
echo "Starting Vite Frontend UI on http://localhost:5173..."
cd ui
npm run dev

# Wait on API server
wait "$API_PID"
