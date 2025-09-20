/// Authentication-related Tauri commands
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use tracing::{error, info};

use crate::state::{AppState, AuthStatus};
use crate::utils::cli_bridge::CliBridge;

/// Login command
#[tauri::command]
pub async fn login(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("Starting login process");

    // Update authentication status to "authenticating"
    {
        let mut app_state = state.lock().await;
        app_state.auth_status = AuthStatus::Authenticating;
    }

    // Create CLI bridge instance
    let cli_bridge = match CliBridge::new().await {
        Ok(bridge) => bridge,
        Err(e) => {
            let error_msg = format!("Failed to initialize CLI bridge: {}", e);
            error!("{}", error_msg);

            let auth_status = AuthStatus::Error {
                message: error_msg.clone(),
            };

            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            return Ok(auth_status);
        },
    };

    // Execute login process using CLI bridge
    match cli_bridge.execute_login().await {
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
        },
        Err(e) => {
            let error_msg = format!("Login failed: {}", e);
            error!("{}", error_msg);

            let auth_status = AuthStatus::Error {
                message: error_msg.clone(),
            };

            // Update error status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            Ok(auth_status)
        },
    }
}

/// Logout command
#[tauri::command]
pub async fn logout(state: State<'_, Arc<Mutex<AppState>>>) -> Result<(), String> {
    info!("Starting logout process");

    // Create CLI bridge instance
    let cli_bridge = match CliBridge::new().await {
        Ok(bridge) => bridge,
        Err(e) => {
            let error_msg = format!("Failed to initialize CLI bridge: {}", e);
            error!("{}", error_msg);
            return Err(error_msg);
        },
    };

    match cli_bridge.execute_logout().await {
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
        },
        Err(e) => {
            let error_msg = format!("Logout failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}

/// Get authentication status command
#[tauri::command]
pub async fn get_auth_status(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("Getting authentication status");

    // Create CLI bridge instance to check actual auth status
    let cli_bridge = match CliBridge::new().await {
        Ok(bridge) => bridge,
        Err(e) => {
            let error_msg = format!("Failed to initialize CLI bridge: {}", e);
            error!("{}", error_msg);
            return Ok(AuthStatus::Error { message: error_msg });
        },
    };

    // Check actual authentication status from CLI
    match cli_bridge.check_auth_status().await {
        Ok(Some(auth_info)) => {
            let auth_status = AuthStatus::Authenticated {
                username: auth_info.username,
                provider: auth_info.provider,
            };

            // Update app state with current status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            Ok(auth_status)
        },
        Ok(None) => {
            let auth_status = AuthStatus::NotAuthenticated;

            // Update app state
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            Ok(auth_status)
        },
        Err(e) => {
            let error_msg = format!("Failed to check authentication status: {}", e);
            error!("{}", error_msg);

            let auth_status = AuthStatus::Error { message: error_msg };

            // Update app state
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            Ok(auth_status)
        },
    }
}
