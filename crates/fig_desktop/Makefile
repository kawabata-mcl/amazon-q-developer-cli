# Amazon Q Desktop Development Makefile

.PHONY: help setup dev build test lint fmt clean install-deps check-env

# Default target
help:
	@echo "Amazon Q Desktop Development Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  setup          - Automatic development environment setup"
	@echo "  install-deps   - Install dependencies"
	@echo "  check-env      - Verify environment"
	@echo ""
	@echo "Development:"
	@echo "  dev            - Start development server"
	@echo "  build          - Debug build"
	@echo "  build-release  - Release build"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  test           - Run tests"
	@echo "  lint           - Run linting"
	@echo "  fmt            - Format code"
	@echo "  check          - Full check (test + lint + format)"
	@echo ""
	@echo "Other:"
	@echo "  clean          - Clean build artifacts"

# Development environment setup
setup:
	@echo "🚀 Setting up development environment..."
	@chmod +x scripts/setup-dev.sh
	@./scripts/setup-dev.sh

# Install dependencies
install-deps:
	@echo "📦 Installing dependencies..."
	@cargo build -p fig_desktop

# Environment verification
check-env:
	@echo "🔍 Verifying environment..."
	@python3 verify_setup.py

# Start development server
dev:
	@echo "🔥 Starting development server..."
	@cargo tauri dev

# Debug build
build:
	@echo "🔨 Running debug build..."
	@cargo build -p fig_desktop

# Release build
build-release:
	@echo "🚀 Running release build..."
	@cargo build -p fig_desktop --release

# Build Tauri application
build-app:
	@echo "📱 Building Tauri application..."
	@cargo tauri build

# Run tests
test:
	@echo "🧪 Running tests..."
	@cargo test -p fig_desktop

# Run linting
lint:
	@echo "🔍 Running linting..."
	@cargo clippy -p fig_desktop -- -D warnings

# Format code
fmt:
	@echo "✨ Formatting code..."
	@cargo +nightly fmt

# Check formatting
fmt-check:
	@echo "📝 Checking formatting..."
	@cargo +nightly fmt --check

# Full check
check: test lint fmt-check
	@echo "✅ Full check completed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cargo clean
	@rm -rf src-tauri/target

# Development watch mode
watch:
	@echo "👀 Watching file changes..."
	@cargo watch -x "build -p fig_desktop"

# Start development server with verbose logging
dev-verbose:
	@echo "🔥 Starting development server with verbose logging..."
	@RUST_LOG=debug cargo tauri dev

# Update dependencies
update-deps:
	@echo "📦 Updating dependencies..."
	@cargo update

# Security audit
audit:
	@echo "🔒 Running security audit..."
	@cargo audit

# Run benchmarks
bench:
	@echo "⚡ Running benchmarks..."
	@cargo bench -p fig_desktop

# Generate documentation
docs:
	@echo "📚 Generating documentation..."
	@cargo doc -p fig_desktop --open

# Reset development environment
reset:
	@echo "🔄 Resetting development environment..."
	@cargo clean
	@rm -rf ../../.venv
	@rm -f .env

# CI/CD check
ci-check: fmt-check lint test
	@echo "🤖 CI/CD check completed"