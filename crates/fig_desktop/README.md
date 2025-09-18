# Amazon Q Developer Desktop Application

A native macOS desktop application for Amazon Q Developer, built with Tauri and Next.js.

## Overview

This desktop application provides a graphical user interface for Amazon Q Developer, allowing users to interact with AI-powered development assistance through an intuitive chat interface. The application is built using:

- **Backend**: Rust with Tauri framework
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Jest (unit tests) and Playwright (E2E tests)

## Features

### Core Functionality
- 🤖 **AI Chat Interface**: Interactive chat with Amazon Q Developer
- 🔐 **AWS Authentication**: Secure login with existing AWS credentials
- 📁 **File Context Management**: Drag & drop files for code analysis
- ⚙️ **Settings Management**: Customizable appearance, keyboard shortcuts, and preferences
- 🎨 **Theme Support**: Light, dark, and system theme modes
- 🚀 **Performance Optimized**: Virtual scrolling for large conversations

### macOS Integration
- 🍎 **Native macOS Experience**: Follows Apple Human Interface Guidelines
- ⌨️ **Keyboard Shortcuts**: Standard macOS shortcuts (Cmd+C, Cmd+V, etc.)
- 🌓 **System Theme Integration**: Automatic dark/light mode switching
- 📦 **DMG Distribution**: Easy installation via DMG package

### Developer Features
- 🎯 **Syntax Highlighting**: Multi-language code highlighting with Prism.js
- 📝 **Markdown Support**: Rich text rendering for AI responses
- 🔄 **Real-time Streaming**: Live response streaming from AI
- 💾 **Conversation History**: Persistent chat history
- 🔍 **Search & Filter**: Find previous conversations

## Architecture

```
fig_desktop/
├── src/                     # Rust backend (Tauri)
│   ├── main.rs              # Application entry point
│   ├── commands/            # Tauri commands
│   │   ├── auth.rs          # Authentication
│   │   ├── chat.rs          # Chat functionality
│   │   ├── file_ops.rs      # File operations
│   │   └── settings.rs      # Settings management
│   ├── state/               # Application state
│   └── utils/               # Utilities and CLI bridge
├── ui/                      # Next.js frontend
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── lib/                 # Utilities and API
│   └── styles/              # CSS and styling
└── src-tauri/               # Tauri configuration
    ├── tauri.conf.json      # Tauri settings
    └── icons/               # Application icons
```

## Development Setup

### Prerequisites

- **Rust**: Latest stable version with `cargo`
- **Node.js**: Version 18 or higher with `npm`
- **Xcode**: For macOS development (Xcode 13+)
- **Tauri CLI**: Install with `cargo install tauri-cli`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd amazon-q-developer-cli/crates/fig_desktop
   ```

2. **Install Rust dependencies**:
   ```bash
   cargo build
   ```

3. **Install Node.js dependencies**:
   ```bash
   cd ui
   npm install
   ```

4. **Install Tauri CLI** (if not already installed):
   ```bash
   cargo install tauri-cli
   ```

### Development Commands

#### Frontend Development
```bash
cd ui

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

#### Tauri Development
```bash
# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build

# Build with specific target
cargo tauri build --target universal-apple-darwin
```

#### Comprehensive Testing
```bash
cd ui
./scripts/test-all.sh
```

## Testing

### Unit Tests
- **Framework**: Jest with React Testing Library
- **Coverage**: Comprehensive component and hook testing
- **Location**: `ui/__tests__/` and `ui/components/**/__tests__/`

### Integration Tests
- **Framework**: Jest with mocked Tauri APIs
- **Coverage**: Cross-component interactions
- **Location**: `ui/__tests__/integration/`

### End-to-End Tests
- **Framework**: Playwright
- **Coverage**: Complete user workflows
- **Location**: `ui/e2e/`

### Test Categories
- **Authentication Flow**: Login/logout processes
- **Chat Functionality**: Message sending and receiving
- **File Operations**: Drag & drop and file management
- **Settings Management**: Configuration changes
- **Performance**: Large data handling and responsiveness
- **Accessibility**: ARIA compliance and keyboard navigation

## Building and Distribution

### Development Build
```bash
cargo tauri build
```

### Production Build with Signing
```bash
# Set environment variables for code signing
export APPLE_CERTIFICATE_PASSWORD="your-password"
export APPLE_ID="your-apple-id"
export APPLE_PASSWORD="your-app-password"

# Build and sign
cargo tauri build --target universal-apple-darwin
```

### DMG Creation
The build process automatically creates a DMG file for distribution:
- **Location**: `target/universal-apple-darwin/release/bundle/dmg/`
- **Features**: Drag-to-install interface, code signing, notarization

## Configuration

### Tauri Configuration
Key settings in `src-tauri/tauri.conf.json`:
- **Window settings**: Size, resizable, title
- **Security**: CSP, allowlist permissions
- **Bundle**: App identifier, icons, targets

### Frontend Configuration
Key settings in `ui/next.config.ts`:
- **Output**: Static export for Tauri compatibility
- **Asset prefix**: Development server configuration
- **Image optimization**: Disabled for static export

## Security

### File System Access
- Restricted to user-selected files only
- No automatic file system scanning
- Secure file reading with proper error handling

### Network Security
- HTTPS-only communication
- Certificate validation
- Secure credential storage

### Code Signing
- Apple Developer certificate required
- Automatic notarization for Gatekeeper compliance
- Secure distribution via DMG

## Performance Optimization

### Frontend Optimizations
- **Virtual Scrolling**: Efficient rendering of large message lists
- **Code Splitting**: Lazy loading of components
- **Memoization**: Optimized re-rendering with React.memo
- **State Management**: Efficient Zustand stores

### Backend Optimizations
- **Async Operations**: Non-blocking Tauri commands
- **Memory Management**: Efficient conversation state handling
- **Database**: SQLite for persistent storage

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Ensure Xcode Command Line Tools are installed
   - Check Rust and Node.js versions
   - Clear `target/` and `node_modules/` directories

2. **Code Signing Issues**:
   - Verify Apple Developer certificate
   - Check environment variables
   - Ensure proper keychain access

3. **Runtime Errors**:
   - Check Tauri command implementations
   - Verify frontend-backend communication
   - Review console logs and error messages

### Debug Mode
```bash
# Run with debug logging
RUST_LOG=debug cargo tauri dev

# Frontend debug mode
npm run dev
```

## Contributing

### Code Standards
- **Rust**: Follow project clippy rules and formatting
- **TypeScript**: Strict type checking enabled
- **Testing**: Maintain test coverage above 80%
- **Documentation**: Document all public APIs

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request with clear description

## License

This project is licensed under the MIT OR Apache-2.0 license.

## Support

For issues and questions:
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Check existing docs and README files
- **Community**: Follow contribution guidelines

---
