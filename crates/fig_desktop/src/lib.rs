/// Amazon Q Desktop GUI Library
/// 
/// This library provides the core functionality for the Amazon Q Desktop GUI application,
/// built on top of the existing chat-cli functionality.

pub mod commands;
pub mod state;
pub mod utils;

// Re-export commonly used types
pub use state::{AppState, AuthStatus, GuiConversationState, GuiMessage};
pub use commands::GuiError;