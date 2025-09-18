#!/bin/bash

# Test All - Comprehensive test runner for the desktop application
set -e

echo "🧪 Running comprehensive test suite for Amazon Q Desktop..."

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
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the crates/ui directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run TypeScript type checking
print_status "Running TypeScript type checking..."
if npm run type-check; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Run ESLint
print_status "Running ESLint..."
if npm run lint; then
    print_success "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

# Run unit tests
print_status "Running unit tests..."
if npm test -- --coverage --watchAll=false; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Build the application
print_status "Building application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi



# Generate test reports
print_status "Generating test reports..."

# Coverage report
if [ -d "coverage" ]; then
    print_status "Unit test coverage report available at: coverage/lcov-report/index.html"
fi



print_success "All tests completed successfully! 🎉"
print_status "Test Summary:"
echo "  ✅ TypeScript type checking"
echo "  ✅ ESLint code quality"
echo "  ✅ Unit tests with coverage"
echo "  ✅ Application build"

echo ""
print_status "Next steps:"
echo "  1. Review test coverage reports"
echo "  2. Run performance tests if needed"
echo "  3. Deploy to staging environment"