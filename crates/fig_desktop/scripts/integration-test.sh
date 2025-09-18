#!/bin/bash

# Integration Test Script for Amazon Q Desktop Application
set -e

echo "🧪 Running integration tests for Amazon Q Desktop Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    print_error "Please run this script from the crates/fig_desktop directory"
    exit 1
fi

# Function to check command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        exit 1
    fi
}

# Check prerequisites
print_status "Checking prerequisites..."
check_command "cargo"
check_command "node"
check_command "npm"

print_success "All prerequisites found"

# Build Rust backend
print_status "Building Rust backend..."
if cargo build; then
    print_success "Rust backend build completed"
else
    print_error "Rust backend build failed"
    exit 1
fi

# Run Rust tests
print_status "Running Rust unit tests..."
if cargo test; then
    print_success "Rust tests passed"
else
    print_error "Rust tests failed"
    exit 1
fi

# Check if UI directory exists
if [ ! -d "ui" ]; then
    print_error "UI directory not found"
    exit 1
fi

cd ui

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Run frontend tests
print_status "Running frontend test suite..."
if ./scripts/test-all.sh; then
    print_success "Frontend tests completed successfully"
else
    print_error "Frontend tests failed"
    exit 1
fi

cd ..

# Build the complete application
print_status "Building complete application..."
if cargo tauri build --debug; then
    print_success "Application build completed"
else
    print_error "Application build failed"
    exit 1
fi

# Check if build artifacts exist
BUILD_DIR="target/debug/bundle/macos"
if [ -d "$BUILD_DIR" ]; then
    print_success "Build artifacts found in $BUILD_DIR"
    
    # List build artifacts
    print_status "Build artifacts:"
    ls -la "$BUILD_DIR"
else
    print_warning "Build directory not found, checking alternative locations..."
    find target -name "*.app" -type d 2>/dev/null | head -5
fi

# Integration test summary
print_success "Integration test completed successfully! 🎉"
print_status "Test Summary:"
echo "  ✅ Prerequisites check"
echo "  ✅ Rust backend build"
echo "  ✅ Rust unit tests"
echo "  ✅ Frontend dependencies"
echo "  ✅ Frontend test suite"
echo "  ✅ Complete application build"

echo ""
print_status "Next steps:"
echo "  1. Test the built application manually"
echo "  2. Run performance tests if needed"
echo "  3. Test on different macOS versions"
echo "  4. Prepare for distribution"

# Optional: Launch the built application for manual testing
if [ "$1" = "--launch" ]; then
    print_status "Launching application for manual testing..."
    APP_PATH=$(find target -name "*.app" -type d | head -1)
    if [ -n "$APP_PATH" ]; then
        open "$APP_PATH"
        print_success "Application launched: $APP_PATH"
    else
        print_warning "Could not find built application to launch"
    fi
fi