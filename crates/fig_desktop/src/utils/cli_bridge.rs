use serde::{Deserialize, Serialize};
/// Module that bridges existing CLI functionality with GUI
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::sync::broadcast;
use tracing::{error, info, warn};
use rand;

use chat_cli::auth::builder_id::{BuilderIdToken, TokenType};
use chat_cli::auth::{is_logged_in, logout as cli_logout};
use chat_cli::cli::Agent;
use chat_cli::cli::chat::context::{ContextFilePath, ContextManager};
use chat_cli::os::Os;

/// CLI bridge implementation
pub struct CliBridge {
    os: Arc<Mutex<Os>>,
    context_manager: Arc<Mutex<ContextManager>>,
    // Reserved for future integration with chat-cli conversation management
    // conversation_states: Arc<Mutex<std::collections::HashMap<String, ConversationState>>>,
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

/// Streaming chat response chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatStreamChunk {
    pub chunk_id: String,
    pub conversation_id: String,
    pub content: String,
    pub is_complete: bool,
    pub error: Option<String>,
}

/// Conversation summary for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationSummary {
    pub id: String,
    pub title: String,
    pub message_count: usize,
    pub created_at: String,
    pub updated_at: String,
}

impl CliBridge {
    /// Create a new CLI bridge instance
    pub async fn new() -> Result<Self, CliBridgeError> {
        info!("Initializing CLI bridge...");
        
        let os = Os::new()
            .await
            .map_err(|e| CliBridgeError::InternalError(format!("Failed to initialize OS: {}", e)))?;

        info!("OS initialized successfully");

        // Log database path for debugging
        match chat_cli::util::directories::database_path() {
            Ok(db_path) => {
                info!("Database path: {}", db_path.display());
                
                // Check if database file exists
                if db_path.exists() {
                    info!("Database file exists");
                } else {
                    warn!("Database file does not exist at: {}", db_path.display());
                }
            },
            Err(e) => {
                error!("Failed to get database path: {}", e);
            }
        }

        // Build a minimal Agent so we can construct ContextManager safely
        let agent = Agent::default();
        let context_manager = ContextManager::from_agent(&agent, 10 * 1024 * 1024)
            .map_err(|e| CliBridgeError::InternalError(format!("Failed to initialize ContextManager: {}", e)))?;

        info!("CLI bridge initialized successfully");

        Ok(Self {
            os: Arc::new(Mutex::new(os)),
            context_manager: Arc::new(Mutex::new(context_manager)),
            // conversation_states: Arc::new(Mutex::new(std::collections::HashMap::new())),
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

    /// Start a new conversation and return its ID
    pub async fn start_new_conversation(&self) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting new conversation via CLI bridge");

        let mut os = self.os.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        let conversation_id = uuid::Uuid::new_v4().to_string();

        // Initialize conversation state
        // Note: This is a simplified implementation
        // In a full implementation, we would create a proper ConversationState
        // with all the necessary components (agents, tool manager, etc.)

        info!("Created new conversation: {}", conversation_id);
        Ok(conversation_id)
    }

    /// Send message with streaming response
    pub async fn send_message_stream(
        &self,
        message: String,
        conversation_id: String,
        stream_sender: broadcast::Sender<ChatStreamChunk>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting streaming message send for conversation: {}", conversation_id);

        let mut os = self.os.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            let error_chunk = ChatStreamChunk {
                chunk_id: uuid::Uuid::new_v4().to_string(),
                conversation_id: conversation_id.clone(),
                content: String::new(),
                is_complete: true,
                error: Some("User is not authenticated".to_string()),
            };
            let _ = stream_sender.send(error_chunk);
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // Drop the OS lock before starting the streaming task
        drop(os);

        // Spawn streaming task to avoid blocking
        let sender_clone = stream_sender.clone();
        let conv_id_clone = conversation_id.clone();
        let message_clone = message.clone();

        tokio::spawn(async move {
            // Simulate more realistic streaming with variable delays and potential errors
            let response_parts = vec![
                ("I understand your question about ", 100),
                (&message_clone, 150),
                (". Let me analyze this for you.\n\n", 200),
                ("Based on your request, here's what I can help with:\n\n", 180),
                ("1. **Code Analysis**: I can review and suggest improvements\n", 220),
                ("2. **Implementation**: I can help write the necessary code\n", 190),
                ("3. **Best Practices**: I can recommend optimal approaches\n\n", 210),
                ("Would you like me to proceed with any specific aspect?", 150),
            ];

            let mut total_delay = 0u64;
            for (i, (part, delay_ms)) in response_parts.iter().enumerate() {
                // Simulate network/processing delay
                tokio::time::sleep(tokio::time::Duration::from_millis(*delay_ms)).await;
                total_delay += delay_ms;

                // Simulate occasional network hiccups (5% chance)
                if total_delay > 500 && rand::random::<f32>() < 0.05 {
                    let error_chunk = ChatStreamChunk {
                        chunk_id: uuid::Uuid::new_v4().to_string(),
                        conversation_id: conv_id_clone.clone(),
                        content: String::new(),
                        is_complete: true,
                        error: Some("Network timeout - please try again".to_string()),
                    };
                    let _ = sender_clone.send(error_chunk);
                    return;
                }

                let chunk = ChatStreamChunk {
                    chunk_id: uuid::Uuid::new_v4().to_string(),
                    conversation_id: conv_id_clone.clone(),
                    content: part.to_string(),
                    is_complete: i == response_parts.len() - 1,
                    error: None,
                };

                if sender_clone.send(chunk).is_err() {
                    warn!("Failed to send stream chunk - receiver may have been dropped");
                    break;
                }
            }
        });

        info!("Started streaming task for conversation: {}", conversation_id);
        Ok(())
    }

    /// Get conversation history
    pub async fn get_conversation_history(
        &self,
        conversation_id: &str,
    ) -> Result<Vec<crate::state::GuiMessage>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Getting conversation history for: {}", conversation_id);

        let mut os = self.os.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // For now, return empty history
        // In a real implementation, this would load from the database
        Ok(Vec::new())
    }

    /// Get all conversations
    pub async fn get_all_conversations(
        &self,
    ) -> Result<Vec<ConversationSummary>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Getting all conversations via CLI bridge");

        let mut os = self.os.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // For now, return empty list
        // In a real implementation, this would load from the database
        Ok(Vec::new())
    }

    /// Check authentication status
    pub async fn check_auth_status(&self) -> Result<Option<AuthInfo>, Box<dyn std::error::Error + Send + Sync>> {
        info!("=== CLI Bridge: Checking authentication status ===");

        let mut os = self.os.lock().await;

        // Log database connection info
        info!("Database connection established");

        let logged_in = is_logged_in(&mut os.database).await;
        info!("is_logged_in() result: {}", logged_in);

        if logged_in {
            info!("User appears to be logged in, retrieving auth info...");
            match self.get_current_auth_info(&mut os).await {
                Ok(auth_info) => {
                    info!("Successfully retrieved auth info: username={}, provider={}", 
                          auth_info.username, auth_info.provider);
                    info!("=== CLI Bridge: Authentication check SUCCESSFUL ===");
                    Ok(Some(auth_info))
                },
                Err(e) => {
                    error!("Failed to get auth info despite being logged in: {}", e);
                    info!("=== CLI Bridge: Authentication check FAILED (auth info error) ===");
                    Err(e)
                }
            }
        } else {
            info!("User is not logged in according to is_logged_in()");
            info!("=== CLI Bridge: Authentication check COMPLETED (not logged in) ===");
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

    /// Add file to context using CLI functionality
    pub async fn add_file_to_context(&self, file_path: String) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Adding file to context via CLI bridge: {}", file_path);

        let mut os = self.os.lock().await;
        let mut context_manager = self.context_manager.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // Add path to context manager
        context_manager.add_paths(&os, vec![file_path], false).await?;

        info!("Successfully added file to context");
        Ok(())
    }

    /// Get current context files
    pub async fn get_context_files(&self) -> Result<Vec<(String, String)>, Box<dyn std::error::Error + Send + Sync>> {
        info!("Getting context files via CLI bridge");

        let mut os = self.os.lock().await;
        let context_manager = self.context_manager.lock().await;

        // Check authentication first
        if !is_logged_in(&mut os.database).await {
            return Err(Box::new(CliBridgeError::AuthenticationError(
                "User is not authenticated".to_string(),
            )));
        }

        // Collect and drop files if exceeding limit
        let (files, _dropped_files) = context_manager.collect_context_files_with_limit(&os).await?;
        Ok(files)
    }

    /// Remove file from context
    pub async fn remove_file_from_context(
        &self,
        file_path: String,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Removing file from context via CLI bridge: {}", file_path);

        let mut context_manager = self.context_manager.lock().await;

        // Remove the path from context manager
        context_manager.paths.retain(|path| match path {
            ContextFilePath::Session(p) | ContextFilePath::Agent(p) => p != &file_path,
        });

        info!("Successfully removed file from context");
        Ok(())
    }

    /// Clear all context files
    pub async fn clear_context(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Clearing all context files via CLI bridge");

        let mut context_manager = self.context_manager.lock().await;
        context_manager.paths.clear();

        info!("Successfully cleared all context files");
        Ok(())
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
