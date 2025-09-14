FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG DEBIAN_FRONTEND=noninteractive

# Base OS packages commonly needed for Rust/Node/Python builds
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       pkg-config \
       libssl-dev \
       libgtk-3-dev \
       libwebkit2gtk-4.1-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev \
       patchelf \
       libsqlite3-dev \
       sqlite3 \
       jq \
       cmake \
       ninja-build \
       zip \
       git-lfs \
       ripgrep \
       python3-venv \
       ca-certificates \
       curl \
       git \
       zsh \
       unzip \
       xz-utils \
       openssh-client \
       software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Use bash login shell for subsequent RUN steps (works well with features)
SHELL ["/bin/bash", "-l", "-c"]

## Install AWS CLI v2 (arch-aware)
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) aws_arch="x86_64" ;; \
      arm64) aws_arch="aarch64" ;; \
      *) echo "Unsupported arch: $arch"; exit 1 ;; \
    esac; \
    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${aws_arch}.zip" -o "/tmp/awscliv2.zip"; \
    unzip -q /tmp/awscliv2.zip -d /tmp; \
    /tmp/aws/install; \
    rm -rf /tmp/aws /tmp/awscliv2.zip


