use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use time::OffsetDateTime;
use uuid::Uuid;

/// Struct that manages the overall application state
#[derive(Debug, Clone)]
pub struct AppState {
    /// Current authentication status
    pub auth_status: AuthStatus,
    /// Active conversation ID
    pub current_conversation_id: Option<String>,
    /// Conversation history
    pub conversations: HashMap<String, GuiConversationState>,
    /// Application settings
    pub settings: AppSettings,
}

impl AppState {
    /// Create a new AppState instance
    pub fn new() -> Self {
        Self {
            auth_status: AuthStatus::NotAuthenticated,
            current_conversation_id: None,
            conversations: HashMap::new(),
            settings: AppSettings::default(),
        }
    }

    /// Start a new conversation
    pub fn start_new_conversation(&mut self) -> String {
        let conversation_id = Uuid::new_v4().to_string();
        let conversation = GuiConversationState {
            id: conversation_id.clone(),
            title: "New Conversation".to_string(),
            messages: Vec::new(),
            agent: None,
            model: None,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        };

        self.conversations.insert(conversation_id.clone(), conversation);
        self.current_conversation_id = Some(conversation_id.clone());
        
        conversation_id
    }

    /// Add a message to a conversation
    pub fn add_message_to_conversation(&mut self, conversation_id: &str, message: GuiMessage) {
        if let Some(conversation) = self.conversations.get_mut(conversation_id) {
            conversation.messages.push(message);
            conversation.updated_at = OffsetDateTime::now_utc();
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Enum representing authentication status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthStatus {
    /// Not authenticated
    NotAuthenticated,
    /// Authentication in progress
    Authenticating,
    /// Successfully authenticated
    Authenticated {
        /// Username
        username: String,
        /// Authentication provider
        provider: String,
    },
    /// Authentication error
    Error {
        /// Error message
        message: String,
    },
}

/// GUI conversation state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiConversationState {
    /// Conversation ID
    pub id: String,
    /// Conversation title
    pub title: String,
    /// Message list
    pub messages: Vec<GuiMessage>,
    /// Agent in use
    pub agent: Option<String>,
    /// Model in use
    pub model: Option<String>,
    /// Creation timestamp
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    /// Last updated timestamp
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

/// GUI message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiMessage {
    /// Message ID
    pub id: String,
    /// Message role
    pub role: MessageRole,
    /// Message content
    pub content: String,
    /// Timestamp
    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: OffsetDateTime,
    /// Tool usage information
    pub tool_uses: Vec<GuiToolUse>,
    /// Metadata
    pub metadata: Option<MessageMetadata>,
}

/// Message role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    /// User message
    User,
    /// Assistant message
    Assistant,
    /// System message
    System,
}

/// GUI tool usage information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiToolUse {
    /// Tool name
    pub tool_name: String,
    /// Input parameters
    pub input: serde_json::Value,
    /// Output result
    pub output: Option<serde_json::Value>,
    /// Execution status
    pub status: ToolUseStatus,
}

/// Tool usage status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToolUseStatus {
    /// Running
    Running,
    /// Success
    Success,
    /// Error
    Error { message: String },
}

/// Message metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    /// Token count
    pub token_count: Option<u32>,
    /// Processing time in milliseconds
    pub processing_time_ms: Option<u64>,
    /// Model information
    pub model_info: Option<String>,
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// Window settings
    pub window_settings: WindowSettings,
    /// Chat settings
    pub chat_settings: ChatSettings,
    /// Appearance settings
    pub appearance: AppearanceSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            window_settings: WindowSettings::default(),
            chat_settings: ChatSettings::default(),
            appearance: AppearanceSettings::default(),
        }
    }
}

/// Window settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSettings {
    /// Window width
    pub width: u32,
    /// Window height
    pub height: u32,
    /// X coordinate
    pub x: Option<i32>,
    /// Y coordinate
    pub y: Option<i32>,
    /// Maximized state
    pub maximized: bool,
}

impl Default for WindowSettings {
    fn default() -> Self {
        Self {
            width: 1200,
            height: 800,
            x: None,
            y: None,
            maximized: false,
        }
    }
}

/// Chat settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSettings {
    /// Default model
    pub default_model: Option<String>,
    /// Default agent
    pub default_agent: Option<String>,
    /// Auto-save setting
    pub auto_save: bool,
    /// Maximum history count
    pub max_history_count: u32,
}

impl Default for ChatSettings {
    fn default() -> Self {
        Self {
            default_model: None,
            default_agent: None,
            auto_save: true,
            max_history_count: 100,
        }
    }
}

/// Appearance settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    /// Theme
    pub theme: Theme,
    /// Font size
    pub font_size: u32,
    /// Font family
    pub font_family: String,
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Auto,
            font_size: 14,
            font_family: "system-ui".to_string(),
        }
    }
}

/// Theme settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    /// Light theme
    Light,
    /// Dark theme
    Dark,
    /// Follow system settings
    Auto,
}