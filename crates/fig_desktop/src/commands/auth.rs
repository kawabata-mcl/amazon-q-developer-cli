/// Authentication-related Tauri commands

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use tracing::{info, error};

use crate::state::{AppState, AuthStatus};
use crate::utils::cli_bridge::CliBridge;
use super::GuiError;

/// Login command
#[tauri::command]
pub async fn login(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AuthStatus, String> {
    info!("Starting login process");
    
    // Update authentication status to "authenticating"
    {
        let mut app_state = state.lock().await;
        app_state.auth_status = AuthStatus::Authenticating;
    }
    
    // Execute login process using CLI bridge
    match CliBridge::execute_login().await {
        Ok(auth_info) => {
            let auth_status = AuthStatus::Authenticated {
                username: auth_info.username,
                provider: auth_info.provider,
            };
            
            // Update authentication status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }
            
            info!("Login successful");
            Ok(auth_status)
        }
        Err(e) => {
            let error_msg = format!("Login failed: {}", e);
            error!("{}", error_msg);
            
            let auth_status = AuthStatus::Error {
                message: error_msg.clone(),
            };
            
            // Update error status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status;
            }
            
            Err(error_msg)
        }
    }
}

/// Logout command
#[tauri::command]
pub async fn logout(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<(), String> {
    info!("Starting logout process");
    
    match CliBridge::execute_logout().await {
        Ok(_) => {
            // Reset authentication status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = AuthStatus::NotAuthenticated;
                // Clear conversation history for security
                app_state.conversations.clear();
                app_state.current_conversation_id = None;
            }
            
            info!("Logout successful");
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("Logout failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Get authentication status command
#[tauri::command]
pub async fn get_auth_status(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AuthStatus, String> {
    let app_state = state.lock().await;
    Ok(app_state.auth_status.clone())
}