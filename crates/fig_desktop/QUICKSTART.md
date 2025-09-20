# Amazon Q Desktop Quick Start

## 🚀 Fastest Setup (5 minutes)

### 1. Run Automatic Setup Script

```bash
cd crates/fig_desktop
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

This script automatically performs the following:
- Install Rust 1.87.0
- Install Tauri CLI
- Install Node.js 22
- Install Python 3.11
- Create virtual environment
- Install dependencies

### 2. Start Development Server

```bash
# Using Makefile (recommended)
make dev

# Or run directly
cargo tauri dev
```

## 🛠️ Manual Setup

Manual setup if automatic script is not available:

### Prerequisites
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Xcode Command Line Tools
xcode-select --install
```

### Rust Environment
```bash
# Install Rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Required versions and components
rustup install 1.87.0
rustup default 1.87.0
rustup component add rustfmt clippy
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Tauri CLI
cargo install tauri-cli@1.6.0 --locked
```

### Node.js Environment
```bash
# Node.js 22
brew install node@22
brew link node@22
```

### Python Environment
```bash
# Python 3.11
brew install python@3.11

# Virtual environment (run from project root)
cd ../..
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
cd crates/fig_desktop
```

### Build Dependencies
```bash
cargo build -p fig_desktop
```

## 📋 Frequently Used Commands

### Makefile Commands (Recommended)
```bash
make help          # List available commands
make dev           # Start development server
make test          # Run tests
make lint          # Run linting
make fmt           # Format code
make check         # Full check
make build         # Debug build
make build-release # Release build
make clean         # Cleanup
```

### Direct Execution
```bash
# Development
cargo tauri dev

# Test
cargo test -p fig_desktop

# Lint
cargo clippy -p fig_desktop

# Format
cargo fmt

# Build
cargo build -p fig_desktop
cargo build -p fig_desktop --release
```

## 🔍 Environment Verification

```bash
# Run verification script
python3 verify_setup.py

# Or
make check-env
```

## 🐛 Troubleshooting

### Common Issues

#### 1. `cargo tauri` command not found
```bash
# Check PATH
echo $PATH
source ~/.cargo/env

# Reinstall
cargo install tauri-cli@1.6.0 --locked --force
```

#### 2. Node.js version is outdated
```bash
# Check version
node --version

# Update to Node.js 22
brew unlink node
brew install node@22
brew link node@22
```

#### 3. Python virtual environment issues
```bash
# Recreate virtual environment
rm -rf ../../.venv
cd ../..
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
cd crates/fig_desktop
```

#### 4. Rust compilation errors
```bash
# Update dependencies
cargo update

# Clean build
cargo clean
cargo build -p fig_desktop
```

## 📁 Project Structure

```
crates/fig_desktop/
├── src/                    # Rust source code
├── src-tauri/             # Tauri configuration
├── ui/                    # Frontend (to be implemented in next task)
├── scripts/               # Development scripts
├── Makefile              # Development commands
├── DEVELOPMENT_SETUP.md  # Detailed setup guide
└── QUICKSTART.md         # This file
```

## 🎯 Next Steps

1. **Start development server**: `make dev`
2. **Modify code**: Edit files under `src/`
3. **Run tests**: `make test`
4. **Implement frontend**: Create `ui/` directory in next task

## 📚 References

- [Tauri Official Documentation](https://tauri.app/v1/guides/)
- [Rust Official Documentation](https://doc.rust-lang.org/book/)
- [Project Architecture](./ARCHITECTURE.md)
- [Detailed Setup Guide](./DEVELOPMENT_SETUP.md)

---

If you encounter issues, please refer to the detailed troubleshooting section in `DEVELOPMENT_SETUP.md`.