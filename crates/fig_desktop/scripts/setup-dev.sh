#!/bin/bash
# Amazon Q Desktop Development Environment Automatic Setup Script

set -e

echo "🚀 Starting Amazon Q Desktop development environment setup..."

# Color output definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "This script is for macOS only"
        exit 1
    fi
    
    # Check Homebrew
    if ! command -v brew &> /dev/null; then
        log_warning "Homebrew is not installed. Would you like to install it? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        else
            log_error "Homebrew is required"
            exit 1
        fi
    fi
    
    log_success "Prerequisites check completed"
}

# Install Xcode Command Line Tools
install_xcode_tools() {
    log_info "Checking Xcode Command Line Tools..."
    
    if ! xcode-select -p &> /dev/null; then
        log_info "Installing Xcode Command Line Tools..."
        xcode-select --install
        log_warning "Please re-run this script after Xcode Command Line Tools installation is complete"
        exit 0
    fi
    
    log_success "Xcode Command Line Tools are already installed"
}

# Setup Rust environment
setup_rust() {
    log_info "Setting up Rust environment..."
    
    # Install Rustup
    if ! command -v rustup &> /dev/null; then
        log_info "Installing Rustup..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # Install required toolchain
    log_info "Installing Rust 1.87.0..."
    rustup install 1.87.0
    rustup default 1.87.0
    
    # Add components
    rustup component add rustfmt clippy
    
    # Add targets
    rustup target add x86_64-apple-darwin
    rustup target add aarch64-apple-darwin
    
    log_success "Rust environment setup completed"
}

# Install Tauri CLI
install_tauri_cli() {
    log_info "Installing Tauri CLI..."
    
    if ! command -v cargo-tauri &> /dev/null; then
        cargo install tauri-cli@1.6.0 --locked
    else
        log_info "Tauri CLI is already installed"
    fi
    
    log_success "Tauri CLI installation completed"
}

# Setup Node.js environment
setup_nodejs() {
    log_info "Setting up Node.js environment..."
    
    # Install Node.js 22
    if ! command -v node &> /dev/null || [[ $(node --version) != v22* ]]; then
        log_info "Installing Node.js 22..."
        brew install node@22
        brew link node@22 --force
    fi
    
    # Check version
    NODE_VERSION=$(node --version)
    log_success "Node.js ${NODE_VERSION} is installed"
}

# Setup Python environment
setup_python() {
    log_info "Setting up Python environment..."
    
    # Install Python 3.11
    if ! command -v python3.11 &> /dev/null; then
        log_info "Installing Python 3.11..."
        brew install python@3.11
    fi
    
    # Create virtual environment
    if [[ ! -d "../../.venv" ]]; then
        log_info "Creating Python virtual environment..."
        cd ../..
        python3.11 -m venv .venv
        cd crates/fig_desktop
    fi
    
    log_success "Python environment setup completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    # Activate Python virtual environment
    cd ../..
    source .venv/bin/activate
    
    # Install Python dependencies
    if [[ -f "scripts/requirements.txt" ]]; then
        pip install -r scripts/requirements.txt
    fi
    
    # Build Rust dependencies
    log_info "Building Rust dependencies (this may take a while on first run)..."
    cargo build -p fig_desktop
    
    cd crates/fig_desktop
    log_success "Dependencies installation completed"
}

# Install development tools
install_dev_tools() {
    log_info "Installing development tools..."
    
    # Install cargo-watch
    if ! command -v cargo-watch &> /dev/null; then
        cargo install cargo-watch
    fi
    
    log_success "Development tools installation completed"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Create .env file
    cat > .env << EOF
# Amazon Q Desktop Development Environment Configuration
RUST_LOG=debug
TAURI_DEBUG=true
DISABLE_SIGNING=true
EOF
    
    log_success "Environment variables setup completed"
}

# Run verification
run_verification() {
    log_info "Running setup verification..."
    
    if [[ -f "verify_setup.py" ]]; then
        cd ../..
        source .venv/bin/activate
        cd crates/fig_desktop
        python3 verify_setup.py
    else
        log_warning "Verification script not found"
    fi
}

# Show usage instructions
show_usage() {
    echo ""
    log_success "🎉 Setup completed!"
    echo ""
    echo "You can start development with the following commands:"
    echo ""
    echo "  # Start development server"
    echo "  cargo tauri dev"
    echo ""
    echo "  # Run tests"
    echo "  cargo test -p fig_desktop"
    echo ""
    echo "  # Run linting"
    echo "  cargo clippy -p fig_desktop"
    echo ""
    echo "  # Format code"
    echo "  cargo fmt"
    echo ""
    echo "For detailed development guide, see DEVELOPMENT_SETUP.md"
}

# Main execution
main() {
    check_prerequisites
    install_xcode_tools
    setup_rust
    install_tauri_cli
    setup_nodejs
    setup_python
    install_dependencies
    install_dev_tools
    setup_environment
    run_verification
    show_usage
}

# Execute script
main "$@"