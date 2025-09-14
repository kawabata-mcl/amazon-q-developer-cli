#!/usr/bin/env bash
set -eo pipefail

echo "[postCreate] start"

# Ensure correct ownership for the vscode user in mounted caches
sudo chown -R vscode:vscode /home/vscode 2>/dev/null || true
sudo chown -R vscode:vscode /workspaces 2>/dev/null || true

export CARGO_TERM_COLOR=always

echo "[postCreate] rust toolchains"
if command -v rustup >/dev/null 2>&1; then
  rustup self update || true
  rustup toolchain install stable --profile minimal
  rustup default stable
  rustup component add rustfmt clippy
  # Add commonly used targets from rust-toolchain.toml
  rustup target add x86_64-unknown-linux-gnu wasm32-wasip1 || true
fi

echo "[postCreate] node & corepack"
if command -v corepack >/dev/null 2>&1; then
  sudo corepack enable || true
fi

echo "[postCreate] cargo tools (tauri, binstall)"
if command -v cargo >/dev/null 2>&1; then
  # Install cargo-binstall for faster binary tool installs (optional)
  curl -fsSL https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash -s -- -y 2>/dev/null || echo "cargo-binstall install failed, continuing..."
  # Install cargo-tauri for building Tauri apps
  cargo install cargo-tauri --locked 2>/dev/null || echo "cargo-tauri install failed, continuing..."
fi

echo "[postCreate] python packages (dev)"
if [ -f "scripts/requirements.txt" ]; then
  pip3 install -U pip 2>/dev/null || true
  pip3 install -r scripts/requirements.txt 2>/dev/null || echo "Python packages install failed, continuing..."
fi

echo "[postCreate] UI deps"
if [ -f "crates/ui/package.json" ]; then
  pushd crates/ui >/dev/null || exit 1
  npm ci 2>/dev/null || npm install 2>/dev/null || echo "npm install failed, continuing..."
  popd >/dev/null || true
fi

echo "[postCreate] git lfs"
if command -v git >/dev/null 2>&1; then
  git lfs install --system || true
fi

echo "[postCreate] cargo fetch"
cargo fetch || true

echo "[postCreate] done"


