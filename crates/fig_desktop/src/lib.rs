/// Amazon Q Desktop Library
/// 
/// This library provides GUI functionality for Amazon Q Developer CLI.

pub mod commands;
pub mod state;
pub mod utils;

// Public API
pub use state::{AppState, AuthStatus, GuiConversationState, GuiMessage};
pub use commands::{GuiError, ChatResponse, FileContent};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_creation() {
        let app_state = AppState::new();
        assert!(matches!(app_state.auth_status, AuthStatus::NotAuthenticated));
        assert!(app_state.current_conversation_id.is_none());
        assert!(app_state.conversations.is_empty());
    }

    #[test]
    fn test_start_new_conversation() {
        let mut app_state = AppState::new();
        let conversation_id = app_state.start_new_conversation();
        
        assert!(app_state.current_conversation_id.is_some());
        assert_eq!(app_state.current_conversation_id.as_ref().unwrap(), &conversation_id);
        assert!(app_state.conversations.contains_key(&conversation_id));
    }
}