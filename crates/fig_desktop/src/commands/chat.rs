/// チャット関連のTauriコマンド

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use tracing::{info, error};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::state::{AppState, GuiMessage, MessageRole, GuiConversationState};
use crate::utils::cli_bridge::CliBridge;
use super::{GuiError, ChatResponse};

/// メッセージ送信コマンド
#[tauri::command]
pub async fn send_message(
    state: State<'_, Arc<Mutex<AppState>>>,
    message: String,
    conversation_id: Option<String>,
) -> Result<ChatResponse, String> {
    info!("メッセージ送信を開始します: {}", message);
    
    let start_time = std::time::Instant::now();
    
    // 会話IDの取得または新規作成
    let conv_id = match conversation_id {
        Some(id) => id,
        None => {
            let mut app_state = state.lock().await;
            app_state.start_new_conversation()
        }
    };
    
    // ユーザーメッセージを会話に追加
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
    
    // CLI bridgeを使用してメッセージを送信
    match CliBridge::send_chat_message(&message).await {
        Ok(response) => {
            let processing_time = start_time.elapsed().as_millis() as u64;
            
            // アシスタントの応答を会話に追加
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
            
            info!("メッセージ送信が成功しました");
            Ok(chat_response)
        }
        Err(e) => {
            let error_msg = format!("メッセージ送信に失敗しました: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 会話履歴取得コマンド
#[tauri::command]
pub async fn get_conversation_history(
    state: State<'_, Arc<Mutex<AppState>>>,
    conversation_id: String,
) -> Result<Vec<GuiMessage>, String> {
    let app_state = state.lock().await;
    
    match app_state.conversations.get(&conversation_id) {
        Some(conversation) => {
            info!("会話履歴を取得しました: {}", conversation_id);
            Ok(conversation.messages.clone())
        }
        None => {
            let error_msg = format!("会話が見つかりません: {}", conversation_id);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 新しい会話開始コマンド
#[tauri::command]
pub async fn start_new_conversation(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<String, String> {
    let mut app_state = state.lock().await;
    let conversation_id = app_state.start_new_conversation();
    
    info!("新しい会話を開始しました: {}", conversation_id);
    Ok(conversation_id)
}

/// 全会話リスト取得コマンド
#[tauri::command]
pub async fn get_all_conversations(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<Vec<GuiConversationState>, String> {
    let app_state = state.lock().await;
    let conversations: Vec<GuiConversationState> = app_state
        .conversations
        .values()
        .cloned()
        .collect();
    
    info!("全会話リストを取得しました: {} 件", conversations.len());
    Ok(conversations)
}

/// 会話削除コマンド
#[tauri::command]
pub async fn delete_conversation(
    state: State<'_, Arc<Mutex<AppState>>>,
    conversation_id: String,
) -> Result<(), String> {
    let mut app_state = state.lock().await;
    
    match app_state.conversations.remove(&conversation_id) {
        Some(_) => {
            // 削除した会話が現在の会話だった場合、現在の会話をクリア
            if app_state.current_conversation_id.as_ref() == Some(&conversation_id) {
                app_state.current_conversation_id = None;
            }
            
            info!("会話を削除しました: {}", conversation_id);
            Ok(())
        }
        None => {
            let error_msg = format!("削除対象の会話が見つかりません: {}", conversation_id);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}