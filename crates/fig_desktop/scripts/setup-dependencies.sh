#!/bin/bash

# Setup script for desktop application dependencies
# This script ensures all required dependencies are installed for building the desktop app

set -euo pipefail

echo "Setting up desktop application dependencies..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Warning: Desktop application currently only supports macOS"
    exit 0
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="18.0.0"

if ! npx semver -r ">=$REQUIRED_NODE_VERSION" "$NODE_VERSION" &> /dev/null; then
    echo "Error: Node.js version $NODE_VERSION is too old. Required: >=$REQUIRED_NODE_VERSION"
    exit 1
fi

echo "✓ Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed"
    exit 1
fi

echo "✓ npm version: $(npm --version)"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$(dirname "$0")/../../ui"

if [[ ! -f package.json ]]; then
    echo "Error: package.json not found in ui directory"
    exit 1
fi

npm ci

echo "✓ Frontend dependencies installed"

# Check Rust toolchain
if ! command -v rustc &> /dev/null; then
    echo "Error: Rust is required but not installed"
    exit 1
fi

echo "✓ Rust version: $(rustc --version)"

# Check Tauri CLI (should be installed by build-macos.sh)
if ! cargo +1.79.0 tauri --version &> /dev/null; then
    echo "Warning: Tauri CLI not found. It should be installed by the main build script."
fi

echo "✓ Desktop application dependencies setup complete"