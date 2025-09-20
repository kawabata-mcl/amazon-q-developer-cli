# Amazon Q Desktop Development Environment Setup

## Prerequisites

### macOS System Requirements
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools
- 8GB+ RAM recommended

## 1. Basic Tools Installation

### Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Xcode Command Line Tools
```bash
xcode-select --install
```

## 2. Rust Development Environment Setup

### Install Rustup
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Install Required Rust Toolchain
```bash
# Install the version specified by the project
rustup install 1.87.0
rustup default 1.87.0

# Add required components
rustup component add rustfmt clippy

# Add targets for macOS
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

### Install Tauri CLI
```bash
# Install specific version (used by project)
cargo install tauri-cli@1.6.0 --locked
```

## 3. Node.js Development Environment Setup

### Install Node.js (using mise)
```bash
# Install mise
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc

# Install Node.js version specified by project
mise install node@22
mise use node@22
```

### Or install Node.js directly
```bash
# Using Homebrew
brew install node@22
brew link node@22

# Check version
node --version  # Verify v22.x.x is displayed
npm --version
```

## 4. Python Development Environment Setup (for build scripts)

### Install Python
```bash
# Using mise
mise install python@3.11
mise use python@3.11

# Or using Homebrew
brew install python@3.11
```

### Create and activate virtual environment
```bash
# Run from project root
python3.11 -m venv .venv
source .venv/bin/activate

# Install required Python packages
pip install -r scripts/requirements.txt
```

## 5. Project Clone and Setup

### Clone Repository
```bash
git clone <repository-url>
cd amazon-q-developer-cli
```

### Install Dependencies
```bash
# Build Rust dependencies (takes time on first run)
cargo build

# Build fig_desktop crate specifically
cargo build -p fig_desktop
```

## 6. Additional Development Tools

### Recommended Editor Extensions
For VS Code users:
- rust-analyzer
- Tauri
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

### Debug Tools
```bash
# Rust debugger
cargo install cargo-watch

# Log display
cargo install bunyan
```

## 7. Start Development Server

### Start Tauri Development Mode
```bash
cd crates/fig_desktop

# Start application in development mode
cargo tauri dev
```

### Frontend Development Server (after Next.js implementation)
```bash
cd crates/fig_desktop/ui

# Install dependencies
npm install

# Start development server
npm run dev
```

## 8. Build and Test

### Development Build
```bash
# Build Rust backend
cargo build -p fig_desktop

# Release build
cargo build -p fig_desktop --release

# Build Tauri application
cd crates/fig_desktop
cargo tauri build
```

### Run Tests
```bash
# Run Rust tests
cargo test -p fig_desktop

# Run all tests
cargo test --workspace
```

### Lint and Format
```bash
# Run Clippy (linting)
cargo clippy -p fig_desktop

# Run formatting
cargo fmt

# Or nightly formatting
cargo +nightly fmt
```

## 9. Troubleshooting

### Common Issues and Solutions

#### 1. Tauri CLI not found
```bash
# Check PATH
echo $PATH
source ~/.cargo/env

# Reinstall
cargo install tauri-cli@1.6.0 --locked --force
```

#### 2. Code signing errors on macOS
```bash
# Create development certificate (development only)
# Add Apple ID in Xcode > Preferences > Accounts
```

#### 3. Node.js version issues
```bash
# Check Node.js version
node --version

# Switch to correct version
mise use node@22
```

#### 4. Python virtual environment issues
```bash
# Recreate virtual environment
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

## 10. Development Workflow

### Daily Development Flow
```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Get latest code
git pull origin main

# 3. Update dependencies
cargo update

# 4. Start development server
cd crates/fig_desktop
cargo tauri dev

# 5. Test after code changes
cargo test -p fig_desktop
cargo clippy -p fig_desktop
```

### Pre-release Checks
```bash
# 1. Run all tests
cargo test --workspace

# 2. Lint check
cargo clippy --workspace -- -D warnings

# 3. Format check
cargo +nightly fmt --check

# 4. Release build
cargo tauri build
```

## 11. Environment Variables Setup

### Development Environment Variables
```bash
# Add to ~/.bashrc or ~/.zshrc
export RUST_LOG=debug
export TAURI_DEBUG=true

# Disable signing for development only
export DISABLE_SIGNING=true
```

## 12. IDE Configuration

### VS Code Configuration Example (.vscode/settings.json)
```json
{
  "rust-analyzer.cargo.features": ["dev"],
  "rust-analyzer.checkOnSave.command": "clippy",
  "editor.formatOnSave": true,
  "files.associations": {
    "*.rs": "rust"
  }
}
```

## 13. Run Verification Script

After setup is complete, run the verification script to check your environment:

```bash
cd crates/fig_desktop
python3 verify_setup.py
```

## Support

If you encounter issues, please check the following:

1. [Tauri Official Documentation](https://tauri.app/v1/guides/getting-started/prerequisites)
2. [Rust Official Documentation](https://doc.rust-lang.org/book/)
3. Project `TROUBLESHOOTING.md` (planned)

---

By following this setup guide, you can start developing the Amazon Q Desktop application.