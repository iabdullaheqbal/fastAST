#!/usr/bin/env bash
set -e

# FastAST Lens Development Launcher
# Starts FastAST Python HTTP API Server and the React/Three.js Vite UI

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

echo "=========================================================="
echo "  FastAST Lens — Codebase Memory & 3D Graph UI"
echo "=========================================================="

# Check if .fastast.db exists, otherwise index
if [ ! -f ".fastast.db" ]; then
    echo "⚡ Initializing FastAST index in $REPO_ROOT..."
    PYTHONPATH=python python3 -m fastast.cli index . || true
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

# 1. Start FastAST HTTP API Server on port 5174
echo "🚀 Starting FastAST API Server on http://127.0.0.1:5174..."
PYTHONPATH=python python3 python/fastast/api_server.py --port 5174 &
API_PID=$!

sleep 1

# 2. Start Vite UI on port 5173
echo "✨ Starting Vite Frontend UI on http://localhost:5173..."
cd ui
npm run dev

# Wait on API server
wait "$API_PID"

