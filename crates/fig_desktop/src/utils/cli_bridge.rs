use serde::{Deserialize, Serialize};
/// Module that bridges existing CLI functionality with GUI
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, warn};

use chat_cli::auth::builder_id::{BuilderIdToken, TokenType};
use chat_cli::auth::{is_logged_in, logout as cli_logout};
use chat_cli::os::Os;

/// CLI bridge implementation
pub struct CliBridge {
    os: Arc<Mutex<Os>>,
}

/// Authentication information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthInfo {
    pub username: String,
    pub provider: String,
}

/// Chat response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliChatResponse {
    pub content: String,
    pub model: Option<String>,
    pub token_count: Option<u32>,
    pub tool_uses: Option<Vec<crate::state::GuiToolUse>>,
}

impl CliBridge {
    /// Create a new CLI bridge instance
    pub async fn new() -> Result<Self, CliBridgeError> {
        let os = Os::new()
            .await
            .map_err(|e| CliBridgeError::InternalError(format!("Failed to initialize OS: {}", e)))?;

        Ok(Self {
            os: Arc::new(Mutex::new(os)),
        })
    }

    /// Execute login process
    pub async fn execute_login(&self) -> Result<AuthInfo, Box<dyn std::error::Error + Send + Sync>> {
        info!("Executing login process via CLI bridge");

        let mut os = self.os.lock().await;

        // Check if already logged in
        if is_logged_in(&mut os.database).await {
            warn!("User is already logged in");
            return self.get_current_auth_info(&mut os).await;
        }

        // GUI-driven login is not implemented here to avoid non-Send CLI flows.
        // Prompt the caller to use the CLI to log in.
        Err(Box::new(CliBridgeError::AuthenticationError(
            "Login from GUI is not implemented. Please run `q login` in a terminal.".to_string(),
        )))
    }

    /// Execute logout process
    pub async fn execute_logout(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Executing logout process via CLI bridge");

        let mut os = self.os.lock().await;

        match cli_logout(&mut os.database).await {
            Ok(_) => {
                info!("Logout successful");
                Ok(())
            },
            Err(e) => {
                error!("Logout failed: {}", e);
                Err(Box::new(CliBridgeError::AuthenticationError(e.to_string())))
            },
        }
    }

    /// Send chat message
    pub async fn send_chat_message(
        &self,
        message: &str,
    ) -> Result<CliChatResponse, Box<dyn std::error::Error + Send + Sync>> {
        info!("Sending chat message via CLI bridge: {}", message);

        let mut os = self.os.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // For now, return a simple response without invoking non-Send chat CLI flow
        Ok(CliChatResponse {
            content: format!("Response to: {}", message),
            model: Some("claude-3-sonnet".to_string()),
            token_count: Some(150),
            tool_uses: None,
        })
    }

    /// Check authentication status
    pub async fn check_auth_status(&self) -> Result<Option<AuthInfo>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Checking authentication status via CLI bridge");

        let mut os = self.os.lock().await;

        if is_logged_in(&mut os.database).await {
            self.get_current_auth_info(&mut os).await.map(Some)
        } else {
            Ok(None)
        }
    }

    /// Get current authentication information
    async fn get_current_auth_info(&self, os: &mut Os) -> Result<AuthInfo, Box<dyn std::error::Error + Send + Sync>> {
        match BuilderIdToken::load(&os.database).await {
            Ok(Some(token)) => {
                let (username, provider) = match token.token_type() {
                    TokenType::BuilderId => ("Builder ID User".to_string(), "AWS Builder ID".to_string()),
                    TokenType::IamIdentityCenter => {
                        let start_url = token.start_url.unwrap_or_else(|| "Unknown".to_string());
                        (
                            "Identity Center User".to_string(),
                            format!("AWS Identity Center ({})", start_url),
                        )
                    },
                };

                Ok(AuthInfo { username, provider })
            },
            Ok(None) => Err(Box::new(CliBridgeError::AuthenticationError(
                "No authentication token found".to_string(),
            ))),
            Err(e) => Err(Box::new(CliBridgeError::AuthenticationError(format!(
                "Failed to load authentication token: {}",
                e
            )))),
        }
    }

    /// Get available models list
    pub async fn get_available_models(&self) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Getting available models list via CLI bridge");

        // For now, return fallback models
        // TODO: Integrate with actual chat-cli model functionality
        Ok(vec![
            "claude-3-sonnet".to_string(),
            "claude-3-haiku".to_string(),
            "gpt-4".to_string(),
            "gpt-3.5-turbo".to_string(),
        ])
    }

    /// Load CLI configuration
    pub async fn load_cli_config(&self) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
        info!("Loading CLI configuration via CLI bridge");

        let mut os = self.os.lock().await;

        let authenticated = is_logged_in(&mut os.database).await;
        let database_path = chat_cli::util::directories::database_path()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|_| "unknown".to_string());

        // Load settings from database
        let config = serde_json::json!({
            "authenticated": authenticated,
            "database_path": database_path,
        });

        Ok(config)
    }
}

/// CLI bridge error types
#[derive(Debug, thiserror::Error)]
pub enum CliBridgeError {
    #[error("Authentication error: {0}")]
    AuthenticationError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Internal error: {0}")]
    InternalError(String),
}
