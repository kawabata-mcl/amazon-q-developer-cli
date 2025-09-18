#!/bin/bash

# Complete build and packaging script for the desktop application
# This script handles the entire process from build to DMG creation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DESKTOP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
RELEASE=true
SKIP_FRONTEND=false
SKIP_SIGNING=false
SKIP_NOTARIZATION=false
SKIP_DMG=false
VERBOSE=false
CLEAN_BUILD=false

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
        --skip-signing)
            SKIP_SIGNING=true
            shift
            ;;
        --skip-notarization)
            SKIP_NOTARIZATION=true
            shift
            ;;
        --skip-dmg)
            SKIP_DMG=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Complete build and packaging script for Amazon Q Desktop"
            echo ""
            echo "Options:"
            echo "  --debug              Build in debug mode (default: release)"
            echo "  --skip-frontend      Skip frontend build"
            echo "  --skip-signing       Skip code signing"
            echo "  --skip-notarization  Skip notarization"
            echo "  --skip-dmg           Skip DMG creation"
            echo "  --clean              Clean build directories before building"
            echo "  --verbose            Enable verbose output"
            echo "  --help               Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  APPLE_ID             Apple ID for notarization"
            echo "  APPLE_PASSWORD       Apple ID password"
            echo "  SIGNING_IDENTITY     Code signing identity"
            echo ""
            echo "This script will:"
            echo "  1. Check dependencies"
            echo "  2. Build frontend (Next.js)"
            echo "  3. Build Tauri application"
            echo "  4. Sign application (if credentials available)"
            echo "  5. Notarize application (if credentials available)"
            echo "  6. Create DMG package"
            echo "  7. Generate checksums"
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

echo "========================================="
echo "Amazon Q Desktop - Build and Package"
echo "========================================="
echo "Release mode: $RELEASE"
echo "Clean build: $CLEAN_BUILD"
echo "Skip frontend: $SKIP_FRONTEND"
echo "Skip signing: $SKIP_SIGNING"
echo "Skip notarization: $SKIP_NOTARIZATION"
echo "Skip DMG: $SKIP_DMG"
echo ""

# Step 1: Check dependencies
echo "Step 1: Checking dependencies..."
"$SCRIPT_DIR/setup-dependencies.sh"

# Step 2: Clean build directories if requested
if [[ "$CLEAN_BUILD" == "true" ]]; then
    echo "Step 2: Cleaning build directories..."
    
    # Clean Rust build artifacts
    cd "$DESKTOP_ROOT"
    cargo clean
    
    # Clean frontend build artifacts
    if [[ -d "$PROJECT_ROOT/crates/ui/out" ]]; then
        rm -rf "$PROJECT_ROOT/crates/ui/out"
    fi
    
    if [[ -d "$PROJECT_ROOT/crates/ui/.next" ]]; then
        rm -rf "$PROJECT_ROOT/crates/ui/.next"
    fi
    
    echo "✓ Build directories cleaned"
else
    echo "Step 2: Skipping clean (use --clean to enable)"
fi

# Step 3: Build frontend
if [[ "$SKIP_FRONTEND" == "false" ]]; then
    echo "Step 3: Building frontend..."
    cd "$PROJECT_ROOT/crates/ui"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        echo "Installing frontend dependencies..."
        npm ci
    fi
    
    # Build frontend
    npm run build
    echo "✓ Frontend build completed"
else
    echo "Step 3: Skipping frontend build"
fi

# Step 4: Build Tauri application
echo "Step 4: Building Tauri application..."
cd "$DESKTOP_ROOT"

BUILD_ARGS=("cargo" "+1.79.0" "tauri" "build")

if [[ "$RELEASE" == "false" ]]; then
    BUILD_ARGS+=("--debug")
    TARGET_DIR="debug"
else
    TARGET_DIR="release"
fi

# macOS specific configuration
if [[ "$OSTYPE" == "darwin"* ]]; then
    BUILD_ARGS+=("--target" "universal-apple-darwin")
    TAURI_TARGET_DIR="src-tauri/target/universal-apple-darwin/$TARGET_DIR"
else
    echo "Warning: This script is optimized for macOS"
    TAURI_TARGET_DIR="src-tauri/target/$TARGET_DIR"
fi

if [[ "$VERBOSE" == "true" ]]; then
    BUILD_ARGS+=("--verbose")
fi

echo "Running: ${BUILD_ARGS[*]}"
"${BUILD_ARGS[@]}"

# Locate the built application
APP_PATH="$DESKTOP_ROOT/$TAURI_TARGET_DIR/bundle/macos/q_desktop.app"

if [[ ! -d "$APP_PATH" ]]; then
    echo "Error: Built application not found at $APP_PATH"
    echo "Available files in target directory:"
    find "$DESKTOP_ROOT/$TAURI_TARGET_DIR" -name "*.app" 2>/dev/null || echo "No .app bundles found"
    exit 1
fi

echo "✓ Tauri application built successfully: $APP_PATH"

# Step 5: Sign and notarize application
if [[ "$SKIP_SIGNING" == "false" ]] || [[ "$SKIP_NOTARIZATION" == "false" ]]; then
    echo "Step 5: Signing and notarization..."
    
    NOTARIZE_ARGS=("--app-path" "$APP_PATH")
    
    if [[ "$SKIP_SIGNING" == "true" ]]; then
        NOTARIZE_ARGS+=("--skip-signing")
    fi
    
    if [[ "$SKIP_NOTARIZATION" == "true" ]]; then
        NOTARIZE_ARGS+=("--skip-notarization")
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        NOTARIZE_ARGS+=("--verbose")
    fi
    
    "$SCRIPT_DIR/notarize-app.sh" "${NOTARIZE_ARGS[@]}"
    echo "✓ Signing and notarization completed"
else
    echo "Step 5: Skipping signing and notarization"
fi

# Step 6: Create DMG package
if [[ "$SKIP_DMG" == "false" ]]; then
    echo "Step 6: Creating DMG package..."
    
    OUTPUT_DIR="$PROJECT_ROOT/build"
    mkdir -p "$OUTPUT_DIR"
    
    DMG_ARGS=(
        "--app-path" "$APP_PATH"
        "--output-path" "$OUTPUT_DIR"
        "--volume-name" "Amazon Q"
        "--dmg-name" "q_desktop.dmg"
    )
    
    if [[ "$SKIP_SIGNING" == "false" ]]; then
        DMG_ARGS+=("--sign")
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        DMG_ARGS+=("--verbose")
    fi
    
    "$SCRIPT_DIR/create-dmg.sh" "${DMG_ARGS[@]}"
    
    DMG_PATH="$OUTPUT_DIR/q_desktop.dmg"
    echo "✓ DMG package created: $DMG_PATH"
else
    echo "Step 6: Skipping DMG creation"
    DMG_PATH=""
fi

# Step 7: Summary
echo ""
echo "========================================="
echo "Build and Package Summary"
echo "========================================="
echo "✓ Application: $APP_PATH"

if [[ -n "$DMG_PATH" ]] && [[ -f "$DMG_PATH" ]]; then
    echo "✓ DMG Package: $DMG_PATH"
    echo "✓ Checksum: $DMG_PATH.sha256"
    
    # Display file sizes
    APP_SIZE=$(du -h "$APP_PATH" | cut -f1)
    DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
    echo "✓ App Size: $APP_SIZE"
    echo "✓ DMG Size: $DMG_SIZE"
fi

echo ""
echo "Build and packaging completed successfully!"
echo ""

# Verification
echo "Final verification:"
if codesign --verify --verbose=1 "$APP_PATH" 2>/dev/null; then
    echo "✓ Application signature is valid"
else
    echo "⚠ Application is not signed"
fi

if spctl --assess --verbose=1 --type execute "$APP_PATH" 2>/dev/null; then
    echo "✓ Application passes Gatekeeper assessment"
else
    echo "⚠ Application may not pass Gatekeeper (normal for unsigned apps)"
fi

echo ""
echo "Ready for distribution!"