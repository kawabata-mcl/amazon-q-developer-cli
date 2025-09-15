/// Chat-related Tauri commands
use std::sync::Arc;
use tauri::{AppHandle, State};
use time::OffsetDateTime;
use tokio::sync::{Mutex, broadcast};
use tracing::{error, info, warn};
use uuid::Uuid;

use super::ChatResponse;
use crate::state::{AppState, GuiConversationState, GuiMessage, MessageRole};
use crate::utils::cli_bridge::{ChatStreamChunk, CliBridge};

/// Send message command (non-streaming)
#[tauri::command]
pub async fn send_message(
    state: State<'_, Arc<Mutex<AppState>>>,
    message: String,
    conversation_id: Option<String>,
) -> Result<ChatResponse, String> {
    info!("Starting message send: {}", message);

    let start_time = std::time::Instant::now();

    // Get conversation ID or create new one
    let conv_id = match conversation_id {
        Some(id) => id,
        None => {
            let mut app_state = state.lock().await;
            app_state.start_new_conversation()
        },
    };

    // Add user message to conversation
    {
        let mut app_state = state.lock().await;
        let user_message = GuiMessage {
            id: Uuid::new_v4().to_string(),
            role: MessageRole::User,
            content: message.clone(),
            timestamp: OffsetDateTime::now_utc(),
            tool_uses: Vec::new(),
            metadata: None,
        };
        app_state.add_message_to_conversation(&conv_id, user_message);
    }

    // Send message using CLI bridge
    let bridge = CliBridge::new().await.map_err(|e| e.to_string())?;
    match bridge.send_chat_message(&message).await {
        Ok(response) => {
            let processing_time = start_time.elapsed().as_millis() as u64;

            // Add assistant response to conversation
            {
                let mut app_state = state.lock().await;
                let assistant_message = GuiMessage {
                    id: Uuid::new_v4().to_string(),
                    role: MessageRole::Assistant,
                    content: response.content.clone(),
                    timestamp: OffsetDateTime::now_utc(),
                    tool_uses: response.tool_uses.unwrap_or_default(),
                    metadata: Some(crate::state::MessageMetadata {
                        token_count: response.token_count,
                        processing_time_ms: Some(processing_time),
                        model_info: response.model.clone(),
                    }),
                };
                app_state.add_message_to_conversation(&conv_id, assistant_message);
            }

            let chat_response = ChatResponse {
                conversation_id: conv_id,
                message: response.content,
                processing_time_ms: processing_time,
                model: response.model,
            };

            info!("Message send successful");
            Ok(chat_response)
        },
        Err(e) => {
            let error_msg = format!("Message send failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}

/// Send message with streaming response
#[tauri::command]
pub async fn send_message_stream(
    app: AppHandle,
    state: State<'_, Arc<Mutex<AppState>>>,
    message: String,
    conversation_id: Option<String>,
) -> Result<String, String> {
    info!("Starting streaming message send: {}", message);

    // Get conversation ID or create new one
    let conv_id = match conversation_id {
        Some(id) => id,
        None => {
            let mut app_state = state.lock().await;
            app_state.start_new_conversation()
        },
    };

    // Add user message to conversation
    {
        let mut app_state = state.lock().await;
        let user_message = GuiMessage {
            id: Uuid::new_v4().to_string(),
            role: MessageRole::User,
            content: message.clone(),
            timestamp: OffsetDateTime::now_utc(),
            tool_uses: Vec::new(),
            metadata: None,
        };
        app_state.add_message_to_conversation(&conv_id, user_message);
    }

    // Create broadcast channel for streaming
    let (stream_sender, mut stream_receiver) = broadcast::channel::<ChatStreamChunk>(100);

    // Clone necessary data for the async task
    let conv_id_clone = conv_id.clone();
    let message_clone = message.clone();
    let app_clone = app.clone();

    // Spawn task to handle streaming
    tokio::spawn(async move {
        let bridge = match CliBridge::new().await {
            Ok(bridge) => bridge,
            Err(e) => {
                error!("Failed to create CLI bridge: {}", e);
                let error_chunk = ChatStreamChunk {
                    chunk_id: Uuid::new_v4().to_string(),
                    conversation_id: conv_id_clone.clone(),
                    content: String::new(),
                    is_complete: true,
                    error: Some(format!("Failed to initialize: {}", e)),
                };
                let _ = tauri::Manager::emit_all(&app_clone, "message_chunk", &error_chunk);
                return;
            },
        };

        // Start streaming
        if let Err(e) = bridge
            .send_message_stream(message_clone, conv_id_clone.clone(), stream_sender)
            .await
        {
            error!("Streaming failed: {}", e);
            let error_chunk = ChatStreamChunk {
                chunk_id: Uuid::new_v4().to_string(),
                conversation_id: conv_id_clone.clone(),
                content: String::new(),
                is_complete: true,
                error: Some(format!("Streaming failed: {}", e)),
            };
            let _ = tauri::Manager::emit_all(&app_clone, "message_chunk", &error_chunk);
        }
    });

    // Listen for stream chunks and emit them to frontend
    let app_for_listener = app.clone();
    let state_for_listener = state.inner().clone();
    let conv_id_for_listener = conv_id.clone();

    tokio::spawn(async move {
        let mut accumulated_content = String::new();
        let assistant_message_id = Uuid::new_v4().to_string();

        while let Ok(chunk) = stream_receiver.recv().await {
            // Emit chunk to frontend
            if let Err(e) = tauri::Manager::emit_all(&app_for_listener, "message_chunk", &chunk) {
                warn!("Failed to emit stream chunk: {}", e);
            }

            // Accumulate content
            accumulated_content.push_str(&chunk.content);

            // If this is the final chunk, add the complete assistant message
            if chunk.is_complete {
                let mut app_state = state_for_listener.lock().await;
                let assistant_message = GuiMessage {
                    id: assistant_message_id,
                    role: MessageRole::Assistant,
                    content: accumulated_content,
                    timestamp: OffsetDateTime::now_utc(),
                    tool_uses: Vec::new(),
                    metadata: Some(crate::state::MessageMetadata {
                        token_count: None,
                        processing_time_ms: None,
                        model_info: Some("claude-3-sonnet".to_string()),
                    }),
                };
                app_state.add_message_to_conversation(&conv_id_for_listener, assistant_message);
                break;
            }
        }
    });

    info!("Started streaming for conversation: {}", conv_id);
    Ok(conv_id)
}

/// Get conversation history command
#[tauri::command]
pub async fn get_conversation_history(
    state: State<'_, Arc<Mutex<AppState>>>,
    conversation_id: String,
) -> Result<Vec<GuiMessage>, String> {
    info!("Getting conversation history for: {}", conversation_id);

    // First try to get from local state
    {
        let app_state = state.lock().await;
        if let Some(conversation) = app_state.conversations.get(&conversation_id) {
            info!("Retrieved conversation history from local state: {}", conversation_id);
            return Ok(conversation.messages.clone());
        }
    }

    // If not found locally, try CLI bridge
    let bridge = CliBridge::new().await.map_err(|e| {
        error!("Failed to create CLI bridge: {}", e);
        format!("Failed to initialize: {}", e)
    })?;

    match bridge.get_conversation_history(&conversation_id).await {
        Ok(messages) => {
            info!("Retrieved conversation history from CLI bridge: {}", conversation_id);
            Ok(messages)
        },
        Err(e) => {
            let error_msg = format!("Failed to get conversation history: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}

/// Start new conversation command
#[tauri::command]
pub async fn start_new_conversation(state: State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    info!("Starting new conversation");

    // Create CLI bridge to ensure proper initialization
    let bridge = CliBridge::new().await.map_err(|e| {
        error!("Failed to create CLI bridge: {}", e);
        format!("Failed to initialize: {}", e)
    })?;

    // Start new conversation via CLI bridge
    let conversation_id = bridge.start_new_conversation().await.map_err(|e| {
        error!("Failed to start conversation via CLI bridge: {}", e);
        format!("Failed to start conversation: {}", e)
    })?;

    // Also update local app state
    {
        let mut app_state = state.lock().await;
        app_state.ensure_conversation_exists(&conversation_id);
        app_state.current_conversation_id = Some(conversation_id.clone());
    }

    info!("Started new conversation: {}", conversation_id);
    Ok(conversation_id)
}

/// Get all conversations list command
#[tauri::command]
pub async fn get_all_conversations(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<Vec<GuiConversationState>, String> {
    info!("Getting all conversations");

    // Get from local state
    let local_conversations = {
        let app_state = state.lock().await;
        app_state.conversations.values().cloned().collect::<Vec<_>>()
    };

    // Also try to get from CLI bridge for completeness
    let bridge = CliBridge::new().await.map_err(|e| {
        warn!("Failed to create CLI bridge, using local state only: {}", e);
        // Don't fail here, just use local state
        e.to_string()
    });

    if let Ok(bridge) = bridge {
        match bridge.get_all_conversations().await {
            Ok(cli_conversations) => {
                info!("Retrieved {} conversations from CLI bridge", cli_conversations.len());
                // For now, just return local conversations
                // In a full implementation, we would merge CLI and local conversations
            },
            Err(e) => {
                warn!("Failed to get conversations from CLI bridge: {}", e);
            },
        }
    }

    info!("Retrieved all conversations list: {} items", local_conversations.len());
    Ok(local_conversations)
}

/// Delete conversation command
#[tauri::command]
pub async fn delete_conversation(
    state: State<'_, Arc<Mutex<AppState>>>,
    conversation_id: String,
) -> Result<(), String> {
    let mut app_state = state.lock().await;

    match app_state.conversations.remove(&conversation_id) {
        Some(_) => {
            // Clear current conversation if the deleted one was active
            if app_state.current_conversation_id.as_ref() == Some(&conversation_id) {
                app_state.current_conversation_id = None;
            }

            info!("Deleted conversation: {}", conversation_id);
            Ok(())
        },
        None => {
            let error_msg = format!("Conversation to delete not found: {}", conversation_id);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}
