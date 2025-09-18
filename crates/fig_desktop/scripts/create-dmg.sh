#!/bin/bash

# Standalone script to create DMG package for the desktop application
# This script can be used independently of the main build process

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DESKTOP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
APP_NAME="Amazon Q"
PRODUCT_NAME="q_desktop"
VOLUME_NAME="$APP_NAME"
DMG_NAME="$PRODUCT_NAME.dmg"
SIGN_DMG=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --app-path)
            shift
            APP_PATH="$1"
            ;;
        --output-path)
            shift
            OUTPUT_PATH="$1"
            ;;
        --volume-name)
            shift
            VOLUME_NAME="$1"
            ;;
        --dmg-name)
            shift
            DMG_NAME="$1"
            ;;
        --sign)
            SIGN_DMG=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --app-path PATH      Path to the .app bundle (required)"
            echo "  --output-path PATH   Output directory for DMG (default: current directory)"
            echo "  --volume-name NAME   DMG volume name (default: '$VOLUME_NAME')"
            echo "  --dmg-name NAME      DMG filename (default: '$DMG_NAME')"
            echo "  --sign               Sign the DMG with Developer ID"
            echo "  --verbose            Enable verbose output"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

if [[ "$VERBOSE" == "true" ]]; then
    set -x
fi

# Validate required parameters
if [[ -z "${APP_PATH:-}" ]]; then
    echo "Error: --app-path is required"
    echo "Use --help for usage information"
    exit 1
fi

if [[ ! -d "$APP_PATH" ]]; then
    echo "Error: App bundle not found: $APP_PATH"
    exit 1
fi

# Set default output path
OUTPUT_PATH="${OUTPUT_PATH:-$(pwd)}"
DMG_PATH="$OUTPUT_PATH/$DMG_NAME"

echo "Creating DMG package..."
echo "App path: $APP_PATH"
echo "Output path: $DMG_PATH"
echo "Volume name: $VOLUME_NAME"

# Create temporary directory for DMG contents
TEMP_DIR=$(mktemp -d)
trap "rm -rf '$TEMP_DIR'" EXIT

echo "Using temporary directory: $TEMP_DIR"

# Copy app to temp directory
cp -R "$APP_PATH" "$TEMP_DIR/"
APP_BASENAME=$(basename "$APP_PATH")

# Create Applications symlink
ln -s /Applications "$TEMP_DIR/Applications"

# Create temporary DMG
TEMP_DMG="$TEMP_DIR/temp.dmg"

echo "Creating temporary DMG..."
hdiutil create \
    -srcfolder "$TEMP_DIR" \
    -volname "$VOLUME_NAME" \
    -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" \
    -format UDRW \
    "$TEMP_DMG"

# Mount the DMG for customization
echo "Mounting DMG for customization..."
MOUNT_OUTPUT=$(hdiutil attach -readwrite -noverify "$TEMP_DMG")
MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep -E '/Volumes/' | sed 's/.*\t//')

if [[ -z "$MOUNT_POINT" ]]; then
    echo "Error: Failed to determine DMG mount point"
    exit 1
fi

echo "DMG mounted at: $MOUNT_POINT"

# Customize DMG appearance using AppleScript
echo "Customizing DMG appearance..."
osascript <<EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 760, 500}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 128
        set position of item "$APP_BASENAME" of container window to {180, 170}
        set position of item "Applications" of container window to {480, 170}
        update without registering applications
        delay 2
        close
    end tell
end tell
EOF

# Sync filesystem
sync

# Unmount the DMG
echo "Unmounting DMG..."
hdiutil detach "$MOUNT_POINT"

# Convert to compressed read-only DMG
echo "Converting to final DMG format..."
rm -f "$DMG_PATH"
hdiutil convert "$TEMP_DMG" \
    -format UDZO \
    -imagekey zlib-level=9 \
    -o "$DMG_PATH"

# Sign DMG if requested
if [[ "$SIGN_DMG" == "true" ]]; then
    echo "Signing DMG..."
    if codesign --sign "Developer ID Application" --timestamp "$DMG_PATH"; then
        echo "✓ DMG signed successfully"
    else
        echo "⚠ Warning: Failed to sign DMG"
    fi
fi

# Generate SHA256 checksum
echo "Generating SHA256 checksum..."
CHECKSUM=$(shasum -a 256 "$DMG_PATH" | cut -d' ' -f1)
echo "$CHECKSUM" > "$DMG_PATH.sha256"
echo "✓ SHA256: $CHECKSUM"

echo "✓ DMG created successfully: $DMG_PATH"
echo "✓ Checksum file: $DMG_PATH.sha256"