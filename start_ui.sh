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
    exit 0
}
trap cleanup SIGINT SIGTERM

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
