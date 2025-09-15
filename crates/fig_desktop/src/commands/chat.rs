/// Chat-related Tauri commands
use std::sync::Arc;
use tauri::State;
use time::OffsetDateTime;
use tokio::sync::Mutex;
use tracing::{error, info};
use uuid::Uuid;

use super::ChatResponse;
use crate::state::{AppState, GuiConversationState, GuiMessage, MessageRole};
use crate::utils::cli_bridge::CliBridge;

/// Send message command
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

/// Get conversation history command
#[tauri::command]
pub async fn get_conversation_history(
    state: State<'_, Arc<Mutex<AppState>>>,
    conversation_id: String,
) -> Result<Vec<GuiMessage>, String> {
    let app_state = state.lock().await;

    match app_state.conversations.get(&conversation_id) {
        Some(conversation) => {
            info!("Retrieved conversation history: {}", conversation_id);
            Ok(conversation.messages.clone())
        },
        None => {
            let error_msg = format!("Conversation not found: {}", conversation_id);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}

/// Start new conversation command
#[tauri::command]
pub async fn start_new_conversation(state: State<'_, Arc<Mutex<AppState>>>) -> Result<String, String> {
    let mut app_state = state.lock().await;
    let conversation_id = app_state.start_new_conversation();

    info!("Started new conversation: {}", conversation_id);
    Ok(conversation_id)
}

/// Get all conversations list command
#[tauri::command]
pub async fn get_all_conversations(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<Vec<GuiConversationState>, String> {
    let app_state = state.lock().await;
    let conversations: Vec<GuiConversationState> = app_state.conversations.values().cloned().collect();

    info!("Retrieved all conversations list: {} items", conversations.len());
    Ok(conversations)
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
