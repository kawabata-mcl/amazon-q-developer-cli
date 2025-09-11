# English Code Standard

## Code Language Policy

All code, comments, documentation, and technical content within this project must be written in English.

### Requirements

- **Code Comments**: All comments in source code files must be in English
- **Variable Names**: Use English names for variables, functions, structs, and modules
- **Error Messages**: All error messages and log outputs must be in English
- **Documentation**: Technical documentation, README files, and API docs must be in English
- **Commit Messages**: Git commit messages should be in English
- **Configuration**: Configuration files and settings should use English

### Exceptions

- User-facing text that is specifically intended for Japanese users may be in Japanese
- Chat conversations with users may be conducted in Japanese when requested
- External documentation references may remain in their original language

### Examples

```rust
// ✅ Good - English comments
/// Handles user authentication for the desktop application
pub async fn login(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("Starting login process");
    // Implementation here
}

// ❌ Bad - Japanese comments  
/// ユーザー認証を処理します
pub async fn login(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("ログイン処理を開始します");
    // Implementation here
}
```

### Rationale

- Ensures code maintainability for international contributors
- Follows industry standards for open-source projects
- Improves code readability and collaboration
- Aligns with existing AWS and Amazon coding standards