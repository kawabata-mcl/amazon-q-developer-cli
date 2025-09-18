# Development Guide

This guide provides detailed information for developers working on the Amazon Q Developer Desktop Application.

## Development Environment Setup

### System Requirements

- **macOS**: 10.15 (Catalina) or later
- **Xcode**: 13.0 or later with Command Line Tools
- **Rust**: Latest stable version (1.70+)
- **Node.js**: 18.0 or later
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 5GB free space for development dependencies

### Initial Setup

1. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

2. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

3. **Install Node.js** (using nvm recommended):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

4. **Install Tauri CLI**:
   ```bash
   cargo install tauri-cli
   ```

5. **Clone and Setup Project**:
   ```bash
   git clone <repository-url>
   cd amazon-q-developer-cli/crates/fig_desktop
   cargo build
   cd ui && npm install
   ```

## Development Workflow

### Daily Development

1. **Start Development Environment**:
   ```bash
   # Terminal 1: Start Tauri dev server
   cargo tauri dev
   
   # Terminal 2: Run tests in watch mode (optional)
   cd ui && npm run test:watch
   ```

2. **Code Changes**:
   - **Rust changes**: Tauri will automatically rebuild and restart
   - **Frontend changes**: Next.js will hot reload
   - **Configuration changes**: May require manual restart

3. **Testing**:
   ```bash
   # Run all tests
   cd ui && ./scripts/test-all.sh
   
   # Run specific test suites
   npm test                    # Unit tests
   npm run test:e2e           # E2E tests
   npm run type-check         # TypeScript
   npm run lint               # ESLint
   ```

### Code Organization

#### Rust Backend (`src/`)

```
src/
├── main.rs                 # Application entry point and Tauri setup
├── commands/               # Tauri command implementations
│   ├── mod.rs             # Module exports
│   ├── auth.rs            # Authentication commands
│   ├── chat.rs            # Chat functionality
│   ├── file_ops.rs        # File operations
│   ├── settings.rs        # Settings management
│   ├── error_logging.rs   # Error handling
│   └── macos_integration.rs # macOS-specific features
├── state/                  # Application state management
│   ├── mod.rs
│   ├── conversation.rs    # Chat state
│   └── app_config.rs      # Configuration state
└── utils/                  # Utility functions
    ├── mod.rs
    └── cli_bridge.rs      # Bridge to existing CLI functionality
```

#### Frontend (`ui/`)

```
ui/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── chat/              # Chat pages
│   ├── settings/          # Settings pages
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── ui/                # Basic UI components
│   ├── chat/              # Chat-specific components
│   ├── auth/              # Authentication components
│   ├── settings/          # Settings components
│   ├── layout/            # Layout components
│   └── optimized/         # Performance-optimized components
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── lib/                    # Utilities and API wrappers
├── types/                  # TypeScript type definitions
├── styles/                 # CSS files
└── e2e/                    # End-to-end tests
```

## Architecture Patterns

### State Management

#### Rust State (Tauri)
```rust
// Application state shared across Tauri commands
#[derive(Default)]
pub struct AppState {
    pub conversations: Arc<Mutex<HashMap<String, Conversation>>>,
    pub settings: Arc<Mutex<AppSettings>>,
    pub auth_status: Arc<Mutex<AuthStatus>>,
}

// Tauri command example
#[tauri::command]
async fn get_conversation(
    state: tauri::State<'_, AppState>,
    conversation_id: String,
) -> Result<Conversation, String> {
    let conversations = state.conversations.lock().await;
    conversations.get(&conversation_id)
        .cloned()
        .ok_or_else(|| "Conversation not found".to_string())
}
```

#### Frontend State (Zustand)
```typescript
// Chat store example
interface ChatState {
  currentConversation: Conversation | null
  conversations: Conversation[]
  isLoading: boolean
  sendMessage: (message: string) => Promise<void>
  loadConversation: (id: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentConversation: null,
  conversations: [],
  isLoading: false,
  
  sendMessage: async (message: string) => {
    set({ isLoading: true })
    try {
      await invoke('send_message', { message })
      // Update state...
    } finally {
      set({ isLoading: false })
    }
  },
  
  loadConversation: async (id: string) => {
    const conversation = await invoke('get_conversation', { conversationId: id })
    set({ currentConversation: conversation })
  }
}))
```

### Error Handling

#### Rust Error Handling
```rust
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    AuthError(String),
    
    #[error("File operation failed: {0}")]
    FileError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
}

// Command with proper error handling
#[tauri::command]
async fn authenticate() -> Result<AuthStatus, AppError> {
    match perform_auth().await {
        Ok(status) => Ok(status),
        Err(e) => Err(AppError::AuthError(e.to_string())),
    }
}
```

#### Frontend Error Handling
```typescript
// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo)
        // Log to error reporting service
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  )
}

// Hook for error handling
export function useErrorHandler() {
  const showNotification = useNotificationStore(state => state.showNotification)
  
  return useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error)
    showNotification({
      type: 'error',
      message: error.message || 'An unexpected error occurred',
      duration: 5000
    })
  }, [showNotification])
}
```

### Performance Optimization

#### Virtual Scrolling
```typescript
// Virtual scrolling for large message lists
export function VirtualMessageList({ messages }: { messages: Message[] }) {
  const { virtualItems, totalSize, scrollElementRef } = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5, // Render 5 extra items for smooth scrolling
  })

  return (
    <div ref={scrollElementRef} className="h-full overflow-auto">
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              left: 0,
              width: '100%',
              height: virtualItem.size,
            }}
          >
            <MessageItem message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Memoization
```typescript
// Memoized components for performance
export const MessageItem = React.memo(({ message }: { message: Message }) => {
  return (
    <div className="message-item">
      <MessageContent content={message.content} />
      <MessageTimestamp timestamp={message.timestamp} />
    </div>
  )
})

// Memoized selectors
const selectCurrentConversation = (state: ChatState) => state.currentConversation
const selectIsLoading = (state: ChatState) => state.isLoading

export function ChatWindow() {
  const conversation = useChatStore(selectCurrentConversation)
  const isLoading = useChatStore(selectIsLoading)
  
  // Component implementation...
}
```

## Testing Strategy

### Unit Testing

#### Rust Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;

    #[tokio::test]
    async fn test_send_message_command() {
        let state = AppState::default();
        let result = send_message(
            tauri::State::from(&state),
            "Hello, test!".to_string(),
            None,
        ).await;
        
        assert!(result.is_ok());
    }
}
```

#### React Component Tests
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatWindow } from '../chat-window'

// Mock Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn()
}))

describe('ChatWindow', () => {
  test('should send message when form is submitted', async () => {
    const mockInvoke = require('@tauri-apps/api/tauri').invoke
    mockInvoke.mockResolvedValue({ id: '1', content: 'Response' })
    
    render(<ChatWindow />)
    
    const input = screen.getByTestId('message-input')
    const button = screen.getByTestId('send-button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('send_message', {
        message: 'Test message'
      })
    })
  })
})
```

### E2E Testing

#### Test Structure
```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'
import { mockTauriAPI } from './helpers/test-utils'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriAPI(page)
  })

  test('should complete login flow', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('login-button').click()
    await expect(page.getByTestId('chat-window')).toBeVisible()
  })
})
```

## Debugging

### Rust Debugging
```bash
# Enable debug logging
RUST_LOG=debug cargo tauri dev

# Use debugger
RUST_LOG=debug cargo tauri dev --debug
```

### Frontend Debugging
```bash
# Next.js debug mode
DEBUG=* npm run dev

# React DevTools available in development
# Chrome DevTools for debugging WebView
```

### Common Debug Scenarios

1. **Tauri Command Issues**:
   - Check command registration in `main.rs`
   - Verify parameter types match between Rust and TypeScript
   - Use `console.log` in frontend and `println!` in Rust

2. **State Synchronization**:
   - Use React DevTools to inspect store state
   - Add logging to Zustand stores
   - Verify Tauri command responses

3. **Performance Issues**:
   - Use React Profiler
   - Monitor memory usage in Activity Monitor
   - Check for unnecessary re-renders

## Build and Deployment

### Development Builds
```bash
# Quick development build
cargo tauri build --debug

# Full development build with all features
cargo tauri build
```

### Production Builds
```bash
# Production build with optimizations
cargo tauri build --release

# Universal binary for macOS
cargo tauri build --target universal-apple-darwin
```

### Code Signing Setup
```bash
# Import certificate
security import certificate.p12 -k ~/Library/Keychains/login.keychain

# Set environment variables
export APPLE_CERTIFICATE_PASSWORD="password"
export APPLE_ID="developer@example.com"
export APPLE_PASSWORD="app-specific-password"
```

## Best Practices

### Code Quality
- Use TypeScript strict mode
- Follow Rust clippy recommendations
- Maintain test coverage above 80%
- Use meaningful commit messages

### Performance
- Minimize bundle size with tree shaking
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize image assets

### Security
- Validate all user inputs
- Use secure communication protocols
- Implement proper error handling
- Follow principle of least privilege

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA labels
- Support keyboard navigation
- Test with screen readers

## Troubleshooting

### Common Issues

1. **"Command not found" errors**:
   - Ensure Tauri commands are registered in `main.rs`
   - Check spelling and parameter names

2. **Build failures**:
   - Clear `target/` directory
   - Update dependencies
   - Check Xcode version compatibility

3. **Hot reload not working**:
   - Restart development server
   - Check file permissions
   - Verify Next.js configuration

4. **Tests failing**:
   - Update test snapshots if needed
   - Check mock implementations
   - Verify test environment setup

### Getting Help

- Check existing GitHub issues
- Review Tauri documentation
- Consult Next.js documentation
- Ask questions in team channels

---

Happy coding! 🚀