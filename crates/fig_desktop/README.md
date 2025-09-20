# Amazon Q Desktop

macOS GUI application for Amazon Q Developer CLI

## Overview

This crate provides existing Amazon Q Developer CLI functionality as a macOS native application using the Tauri framework.

## Features

- **Authentication**: Login/logout using AWS SSO
- **Chat**: Real-time chat with Amazon Q Developer
- **File Operations**: Add file context via drag & drop
- **Settings Management**: Manage application settings
- **Conversation History**: Save and manage chat history

## Architecture

- **Frontend**: Next.js + React + TypeScript
- **Backend**: Rust + Tauri
- **CLI Integration**: Integration with existing chat-cli crate

## Development

### Prerequisites

- Rust 1.79.0 or higher
- Node.js 22 or higher
- Tauri CLI

### Build

```bash
# Development mode
cargo tauri dev

# Release build
cargo tauri build
```

### Project Structure

```
crates/fig_desktop/
├── src/                     # Rust backend
│   ├── main.rs              # Entry point
│   ├── state.rs             # Application state management
│   ├── commands/            # Tauri commands
│   └── utils/               # Utilities
├── src-tauri/               # Tauri configuration
│   └── tauri.conf.json      # Tauri configuration file
└── ui/                      # Next.js frontend (TODO)
```

## TODO

- [ ] Implement Next.js frontend
- [ ] Integrate with actual CLI functionality
- [ ] Add application icons
- [ ] DMG packaging
- [ ] Code signing and notarization