#!/bin/bash

# Standalone script to sign and notarize the desktop application
# This script handles the complete code signing and notarization process

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Default values
TEAM_ID="94KV3E626L"  # AMZN Mobile LLC
SIGNING_IDENTITY="Developer ID Application"
VERBOSE=false
SKIP_SIGNING=false
SKIP_NOTARIZATION=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --app-path)
            shift
            APP_PATH="$1"
            ;;
        --apple-id)
            shift
            APPLE_ID="$1"
            ;;
        --apple-password)
            shift
            APPLE_PASSWORD="$1"
            ;;
        --team-id)
            shift
            TEAM_ID="$1"
            ;;
        --signing-identity)
            shift
            SIGNING_IDENTITY="$1"
            ;;
        --skip-signing)
            SKIP_SIGNING=true
            ;;
        --skip-notarization)
            SKIP_NOTARIZATION=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --app-path PATH           Path to the .app bundle (required)"
            echo "  --apple-id EMAIL          Apple ID for notarization"
            echo "  --apple-password PASS     Apple ID password or app-specific password"
            echo "  --team-id ID              Apple Developer Team ID (default: $TEAM_ID)"
            echo "  --signing-identity ID     Code signing identity (default: '$SIGNING_IDENTITY')"
            echo "  --skip-signing            Skip code signing step"
            echo "  --skip-notarization       Skip notarization step"
            echo "  --verbose                 Enable verbose output"
            echo "  --help                    Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  APPLE_ID                  Apple ID for notarization"
            echo "  APPLE_PASSWORD            Apple ID password"
            echo "  NOTARIZATION_PASSWORD     App-specific password for notarization"
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

# Use environment variables as fallback
APPLE_ID="${APPLE_ID:-${APPLE_ID:-}}"
APPLE_PASSWORD="${APPLE_PASSWORD:-${NOTARIZATION_PASSWORD:-}}"

APP_BASENAME=$(basename "$APP_PATH")
echo "Processing application: $APP_BASENAME"
echo "App path: $APP_PATH"

# Code signing
if [[ "$SKIP_SIGNING" == "false" ]]; then
    echo "Step 1: Code signing..."
    
    # Check if signing identity is available
    if ! security find-identity -v -p codesigning | grep -q "$SIGNING_IDENTITY"; then
        echo "Error: Signing identity '$SIGNING_IDENTITY' not found"
        echo "Available identities:"
        security find-identity -v -p codesigning
        exit 1
    fi
    
    echo "Signing with identity: $SIGNING_IDENTITY"
    
    # Sign the application bundle
    codesign --force --deep --sign "$SIGNING_IDENTITY" \
        --timestamp --options runtime \
        "$APP_PATH"
    
    # Verify the signature
    echo "Verifying signature..."
    codesign --verify --verbose=4 "$APP_PATH"
    
    echo "✓ Code signing completed successfully"
else
    echo "Skipping code signing step"
fi

# Notarization
if [[ "$SKIP_NOTARIZATION" == "false" ]]; then
    echo "Step 2: Notarization..."
    
    # Check if Apple ID credentials are provided
    if [[ -z "$APPLE_ID" ]] || [[ -z "$APPLE_PASSWORD" ]]; then
        echo "Warning: Apple ID credentials not provided, skipping notarization"
        echo "Set APPLE_ID and APPLE_PASSWORD environment variables or use --apple-id and --apple-password"
        exit 0
    fi
    
    # Create ZIP archive for notarization
    ZIP_PATH="$(dirname "$APP_PATH")/${APP_BASENAME}.zip"
    echo "Creating ZIP archive: $ZIP_PATH"
    
    rm -f "$ZIP_PATH"
    ditto -c -k --keepParent "$APP_PATH" "$ZIP_PATH"
    
    # Submit to Apple notary service
    echo "Submitting to Apple notary service..."
    echo "This may take several minutes..."
    
    SUBMIT_OUTPUT=$(xcrun notarytool submit "$ZIP_PATH" \
        --team-id "$TEAM_ID" \
        --apple-id "$APPLE_ID" \
        --password "$APPLE_PASSWORD" \
        --wait \
        --output-format json)
    
    echo "Notarization response:"
    echo "$SUBMIT_OUTPUT"
    
    # Check if notarization was successful
    STATUS=$(echo "$SUBMIT_OUTPUT" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [[ "$STATUS" == "Accepted" ]]; then
        echo "✓ Notarization successful"
        
        # Staple the notarization ticket
        echo "Stapling notarization ticket..."
        xcrun stapler staple "$APP_PATH"
        
        # Verify stapling
        echo "Verifying stapled ticket..."
        xcrun stapler validate "$APP_PATH"
        
        echo "✓ Notarization ticket stapled successfully"
    else
        echo "✗ Notarization failed with status: $STATUS"
        
        # Get submission ID for detailed logs
        SUBMISSION_ID=$(echo "$SUBMIT_OUTPUT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        if [[ -n "$SUBMISSION_ID" ]]; then
            echo "Getting detailed logs for submission: $SUBMISSION_ID"
            xcrun notarytool log "$SUBMISSION_ID" \
                --team-id "$TEAM_ID" \
                --apple-id "$APPLE_ID" \
                --password "$APPLE_PASSWORD"
        fi
        
        exit 1
    fi
    
    # Clean up ZIP file
    rm -f "$ZIP_PATH"
    
else
    echo "Skipping notarization step"
fi

echo "✓ Application processing completed successfully"

# Final verification
echo "Final verification..."
codesign --verify --verbose=4 "$APP_PATH"
spctl --assess --verbose=4 --type execute "$APP_PATH"

echo "✓ All verification checks passed"
echo "Application is ready for distribution: $APP_PATH"