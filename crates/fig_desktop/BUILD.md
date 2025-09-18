# Amazon Q Desktop - Build Guide

This document describes how to build and package the Amazon Q Desktop application.

## Prerequisites

### System Requirements
- macOS 10.15 or later
- Xcode Command Line Tools
- Node.js 18.0.0 or later
- Rust toolchain (managed by the main build script)
- Python 3.11 (for main build integration)

### Development Tools
- Tauri CLI 1.6.0 (automatically installed)
- npm or yarn
- Git

### Code Signing (Optional)
- Apple Developer Account
- Developer ID Application certificate
- App-specific password for notarization

## Quick Start

### Development Build
```bash
# Build for development (debug mode)
./crates/fig_desktop/scripts/build-and-package.sh --debug --skip-signing --skip-notarization
```

### Production Build
```bash
# Full production build with signing and notarization
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="your-app-specific-password"
./crates/fig_desktop/scripts/build-and-package.sh
```

## Build Scripts

### Main Build Script
The desktop application is integrated into the main build process:

```bash
# Build everything including desktop app (macOS only)
python3.11 scripts/main.py build
```

### Standalone Desktop Build
For desktop-only development:

```bash
# Complete build and package
./crates/fig_desktop/scripts/build-and-package.sh

# Build only (no packaging)
./crates/fig_desktop/scripts/build-desktop.sh

# Create DMG from existing app
./crates/fig_desktop/scripts/create-dmg.sh --app-path path/to/app.app

# Sign and notarize existing app
./crates/fig_desktop/scripts/notarize-app.sh --app-path path/to/app.app
```

## Build Options

### build-and-package.sh Options
- `--debug`: Build in debug mode (faster, larger binary)
- `--skip-frontend`: Skip Next.js frontend build
- `--skip-signing`: Skip code signing
- `--skip-notarization`: Skip Apple notarization
- `--skip-dmg`: Skip DMG creation
- `--clean`: Clean build directories first
- `--verbose`: Enable verbose output

### Environment Variables
- `APPLE_ID`: Apple ID for notarization
- `APPLE_PASSWORD`: App-specific password
- `SIGNING_IDENTITY`: Code signing identity (default: "Developer ID Application")

## Build Process

The complete build process includes:

1. **Dependency Check**: Verify Node.js, npm, Rust toolchain
2. **Frontend Build**: Build Next.js application with static export
3. **Tauri Build**: Build Rust backend and bundle with frontend
4. **Code Signing**: Sign the application bundle (if credentials provided)
5. **Notarization**: Submit to Apple notary service (if credentials provided)
6. **DMG Creation**: Create installer package with custom layout
7. **Verification**: Verify signatures and Gatekeeper compatibility

## Output Files

### Debug Build
```
crates/fig_desktop/src-tauri/target/universal-apple-darwin/debug/bundle/macos/q_desktop.app
```

### Release Build
```
crates/fig_desktop/src-tauri/target/universal-apple-darwin/release/bundle/macos/q_desktop.app
build/q_desktop.dmg
build/q_desktop.dmg.sha256
```

## Integration with Main Build

The desktop application is automatically built when running the main build script on macOS:

```python
# In scripts/build.py
if isDarwin():
    info("Building", DESKTOP_PACKAGE_NAME)
    desktop_app_path = build_desktop_app(release=release, signing_data=signing_data)
```

## Code Signing and Notarization

### Automatic (CI/CD)
The main build script handles signing and notarization automatically when:
- Running on macOS
- `SIGNING_ROLE_ARN` environment variable is set
- `SIGNING_BUCKET_NAME` environment variable is set
- `SIGNING_APPLE_NOTARIZING_SECRET_ARN` environment variable is set

### Manual
For local development with signing:

```bash
# Set up credentials
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="your-app-specific-password"

# Build with signing
./crates/fig_desktop/scripts/build-and-package.sh
```

### Skip Signing (Development)
For local development without signing:

```bash
./crates/fig_desktop/scripts/build-and-package.sh --skip-signing --skip-notarization
```

## Troubleshooting

### Common Issues

#### Node.js Version
```bash
# Check Node.js version
node --version

# Should be 18.0.0 or later
```

#### Tauri CLI Not Found
```bash
# Install Tauri CLI manually
cargo install tauri-cli@1.6.0 --locked
```

#### Frontend Build Fails
```bash
# Clean and rebuild frontend
cd crates/ui
rm -rf node_modules .next out
npm ci
npm run build
```

#### Code Signing Fails
```bash
# Check available signing identities
security find-identity -v -p codesigning

# Verify certificate is valid
security find-certificate -c "Developer ID Application"
```

#### Notarization Fails
```bash
# Check Apple ID credentials
xcrun notarytool store-credentials --apple-id "your-apple-id@example.com" --team-id "94KV3E626L"

# Test notarization
xcrun notarytool submit test.zip --keychain-profile "notarytool-profile"
```

### Build Logs
Enable verbose output for debugging:

```bash
./crates/fig_desktop/scripts/build-and-package.sh --verbose
```

### Clean Build
If experiencing issues, try a clean build:

```bash
./crates/fig_desktop/scripts/build-and-package.sh --clean
```

## Development Workflow

### Frontend Development
```bash
# Start frontend dev server
cd crates/ui
npm run dev

# In another terminal, start Tauri dev mode
cd crates/fig_desktop
cargo tauri dev
```

### Backend Development
```bash
# Build and test Rust code
cd crates/fig_desktop
cargo build
cargo test
```

### Full Integration Test
```bash
# Build and test complete application
./crates/fig_desktop/scripts/build-and-package.sh --debug
```

## CI/CD Integration

The desktop application build is integrated into the main CI/CD pipeline:

1. **build-macos.sh**: Installs Tauri CLI and dependencies
2. **scripts/build.py**: Builds desktop app on macOS
3. **Signing**: Uses existing CD Signer integration
4. **Distribution**: DMG is uploaded to S3 with other artifacts

## File Structure

```
crates/fig_desktop/
├── src/                    # Rust source code
├── src-tauri/             # Tauri configuration
│   ├── tauri.conf.json    # Tauri settings
│   └── icons/             # Application icons
├── scripts/               # Build scripts
│   ├── build-and-package.sh
│   ├── build-desktop.sh
│   ├── create-dmg.sh
│   ├── notarize-app.sh
│   └── setup-dependencies.sh
├── BUILD.md               # This file
└── Cargo.toml            # Rust dependencies
```

## Next Steps

1. **Icon Assets**: Replace placeholder icons with official Amazon Q icons
2. **Background Image**: Add custom DMG background image
3. **Windows Support**: Extend build scripts for Windows
4. **Linux Support**: Add Linux packaging (AppImage, deb, rpm)
5. **Auto-updater**: Implement Tauri updater for automatic updates