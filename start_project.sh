#!/bin/bash

# MMA Manager - One-Click Project Starter
# This script sets up and starts the MMA Manager application (for macOS/Linux)

echo ""
echo "================================"
echo "  MMA MANAGER - Project Starter"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[+] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[-] Failed to install dependencies"
        exit 1
    fi
    echo "[+] Dependencies installed successfully"
else
    echo "[+] Dependencies already installed"
fi

echo ""
echo "[+] Starting development server..."
echo "[+] The browser should open automatically at http://localhost:5173"
echo ""

# Start the development server
npm run dev
