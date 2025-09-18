#!/bin/bash

# Standalone build script for the desktop application
# This can be used for development builds or when building only the desktop app

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DESKTOP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
RELEASE=true
SKIP_FRONTEND=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            RELEASE=false
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --debug          Build in debug mode (default: release)"
            echo "  --skip-frontend  Skip frontend build (use existing build)"
            echo "  --verbose        Enable verbose output"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [[ "$VERBOSE" == "true" ]]; then
    set -x
fi

echo "Building Amazon Q Desktop Application"
echo "Release mode: $RELEASE"
echo "Skip frontend: $SKIP_FRONTEND"

# Check dependencies
echo "Checking dependencies..."
"$SCRIPT_DIR/setup-dependencies.sh"

# Build frontend if not skipped
if [[ "$SKIP_FRONTEND" == "false" ]]; then
    echo "Building frontend..."
    cd "$PROJECT_ROOT/crates/ui"
    npm run build
    echo "✓ Frontend build complete"
fi

# Build Tauri application
echo "Building Tauri application..."
cd "$DESKTOP_ROOT"

BUILD_ARGS=("cargo" "+1.79.0" "tauri" "build")

if [[ "$RELEASE" == "false" ]]; then
    BUILD_ARGS+=("--debug")
fi

# macOS specific configuration
if [[ "$OSTYPE" == "darwin"* ]]; then
    BUILD_ARGS+=("--target" "universal-apple-darwin")
fi

if [[ "$VERBOSE" == "true" ]]; then
    BUILD_ARGS+=("--verbose")
fi

"${BUILD_ARGS[@]}"

# Report build results
TARGET_DIR="release"
if [[ "$RELEASE" == "false" ]]; then
    TARGET_DIR="debug"
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    APP_PATH="$DESKTOP_ROOT/src-tauri/target/universal-apple-darwin/$TARGET_DIR/bundle/macos/q_desktop.app"
    DMG_PATH="$DESKTOP_ROOT/src-tauri/target/universal-apple-darwin/$TARGET_DIR/bundle/dmg/q_desktop.dmg"
    
    if [[ -d "$APP_PATH" ]]; then
        echo "✓ Desktop application built successfully:"
        echo "  App: $APP_PATH"
        
        if [[ -f "$DMG_PATH" ]]; then
            echo "  DMG: $DMG_PATH"
        fi
    else
        echo "✗ Build failed - application not found at expected location"
        exit 1
    fi
else
    echo "✓ Build completed (non-macOS platform)"
fi

echo "Desktop application build complete!"