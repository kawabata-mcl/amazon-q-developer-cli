/// 認証関連のTauriコマンド

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use tracing::{info, error};

use crate::state::{AppState, AuthStatus};
use crate::utils::cli_bridge::CliBridge;
use super::GuiError;

/// ログインコマンド
#[tauri::command]
pub async fn login(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AuthStatus, String> {
    info!("ログイン処理を開始します");
    
    // 認証状態を「認証中」に更新
    {
        let mut app_state = state.lock().await;
        app_state.auth_status = AuthStatus::Authenticating;
    }
    
    // CLI bridgeを使用してログイン処理を実行
    match CliBridge::execute_login().await {
        Ok(auth_info) => {
            let auth_status = AuthStatus::Authenticated {
                username: auth_info.username,
                provider: auth_info.provider,
            };
            
            // 認証状態を更新
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }
            
            info!("ログインが成功しました");
            Ok(auth_status)
        }
        Err(e) => {
            let error_msg = format!("ログインに失敗しました: {}", e);
            error!("{}", error_msg);
            
            let auth_status = AuthStatus::Error {
                message: error_msg.clone(),
            };
            
            // エラー状態を更新
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status;
            }
            
            Err(error_msg)
        }
    }
}

/// ログアウトコマンド
#[tauri::command]
pub async fn logout(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<(), String> {
    info!("ログアウト処理を開始します");
    
    match CliBridge::execute_logout().await {
        Ok(_) => {
            // 認証状態をリセット
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = AuthStatus::NotAuthenticated;
                // 会話履歴もクリア（セキュリティのため）
                app_state.conversations.clear();
                app_state.current_conversation_id = None;
            }
            
            info!("ログアウトが成功しました");
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("ログアウトに失敗しました: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// 認証状態取得コマンド
#[tauri::command]
pub async fn get_auth_status(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AuthStatus, String> {
    let app_state = state.lock().await;
    Ok(app_state.auth_status.clone())
}