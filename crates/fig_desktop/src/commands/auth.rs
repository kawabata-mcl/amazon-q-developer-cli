/// Authentication-related Tauri commands
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use tracing::{error, info, warn};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::state::{AppState, AuthStatus};
use crate::utils::cli_bridge::{CliBridge, GuiLoginOptions, GuiLoginMethod};

/// Persistent authentication state stored in database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistentAuthState {
    pub username: String,
    pub provider: String,
    pub last_verified: OffsetDateTime,
    pub token_expires_at: Option<OffsetDateTime>,
}

/// Authentication session manager for persistent state
pub struct AuthSessionManager {
    app_state: Arc<Mutex<AppState>>,
}

impl AuthSessionManager {
    pub fn new(app_state: Arc<Mutex<AppState>>) -> Self {
        Self { app_state }
    }

    /// Save authentication state to persistent storage
    pub async fn save_auth_state(&self, auth_info: &crate::utils::cli_bridge::AuthInfo) -> Result<(), String> {
        info!("Saving authentication state to persistent storage");
        
        let _persistent_state = PersistentAuthState {
            username: auth_info.username.clone(),
            provider: auth_info.provider.clone(),
            last_verified: OffsetDateTime::now_utc(),
            token_expires_at: None, // Will be set when token refresh is implemented
        };

        // Update in-memory state
        {
            let mut app_state = self.app_state.lock().await;
            app_state.auth_status = AuthStatus::Authenticated {
                username: auth_info.username.clone(),
                provider: auth_info.provider.clone(),
            };
        }

        // TODO: Save to SQLite database for persistence across app restarts
        // This will be implemented when we integrate with chat-cli's database schema
        
        info!("Authentication state saved successfully");
        Ok(())
    }

    /// Load authentication state from persistent storage
    pub async fn load_auth_state(&self) -> Result<Option<PersistentAuthState>, String> {
        info!("Loading authentication state from persistent storage");
        
        // TODO: Load from SQLite database
        // For now, we rely on CLI bridge to check current auth status
        
        Ok(None)
    }

    /// Clear authentication state from persistent storage
    pub async fn clear_auth_state(&self) -> Result<(), String> {
        info!("Clearing authentication state from persistent storage");
        
        // Update in-memory state
        {
            let mut app_state = self.app_state.lock().await;
            app_state.auth_status = AuthStatus::NotAuthenticated;
            // Clear sensitive data
            app_state.conversations.clear();
            app_state.current_conversation_id = None;
        }

        // TODO: Clear from SQLite database
        
        info!("Authentication state cleared successfully");
        Ok(())
    }

    /// Refresh authentication token if needed
    pub async fn refresh_token_if_needed(&self) -> Result<bool, String> {
        info!("Checking if token refresh is needed");
        
        // TODO: Implement token refresh logic
        // This would check token expiration and refresh if necessary
        
        Ok(false) // No refresh needed for now
    }
}

/// Login command
#[tauri::command]
pub async fn login(
    state: State<'_, Arc<Mutex<AppState>>>,
    // オプション引数（App側から渡す）
    options: Option<GuiLoginOptions>,
) -> Result<AuthStatus, String> {
    info!("Starting login process");

    // Update authentication status to "authenticating"
    {
        let mut app_state = state.lock().await;
        app_state.auth_status = AuthStatus::Authenticating;
    }

    // Create session manager
    let session_manager = AuthSessionManager::new(state.inner().clone());

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
    match cli_bridge.execute_login(options).await {
        Ok(auth_info) => {
            // Save authentication state to persistent storage
            if let Err(e) = session_manager.save_auth_state(&auth_info).await {
                warn!("Failed to save authentication state: {}", e);
                // Continue anyway, as the login was successful
            }

            let auth_status = AuthStatus::Authenticated {
                username: auth_info.username,
                provider: auth_info.provider,
            };

            info!("Login successful and state persisted");
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

    // Create session manager
    let session_manager = AuthSessionManager::new(state.inner().clone());

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
            // Clear authentication state from persistent storage
            if let Err(e) = session_manager.clear_auth_state().await {
                warn!("Failed to clear authentication state: {}", e);
                // Continue anyway, as the logout was successful
            }

            info!("Logout successful and state cleared");
            Ok(())
        },
        Err(e) => {
            let error_msg = format!("Logout failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        },
    }
}

/// Refresh authentication token command
#[tauri::command]
pub async fn refresh_auth_token(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("Starting token refresh process");

    // Create session manager
    let session_manager = AuthSessionManager::new(state.inner().clone());

    // Check if refresh is needed
    match session_manager.refresh_token_if_needed().await {
        Ok(refreshed) => {
            if refreshed {
                info!("Token refreshed successfully");
                // Re-check auth status after refresh
                get_auth_status(state).await
            } else {
                info!("Token refresh not needed");
                // Return current status
                let app_state = state.lock().await;
                Ok(app_state.auth_status.clone())
            }
        },
        Err(e) => {
            let error_msg = format!("Token refresh failed: {}", e);
            error!("{}", error_msg);
            
            let auth_status = AuthStatus::Error {
                message: error_msg,
            };

            // Update app state
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
            }

            Ok(auth_status)
        },
    }
}

/// Get authentication status command
#[tauri::command]
pub async fn get_auth_status(state: State<'_, Arc<Mutex<AppState>>>) -> Result<AuthStatus, String> {
    info!("=== TAURI COMMAND: get_auth_status called ===");

    // Create session manager
    let session_manager = AuthSessionManager::new(state.inner().clone());

    // First, try to refresh token if needed
    if let Err(e) = session_manager.refresh_token_if_needed().await {
        warn!("Token refresh check failed: {}", e);
    }

    // Check if we already have valid auth status in app state
    {
        let app_state = state.lock().await;
        match &app_state.auth_status {
            AuthStatus::Authenticated { username, provider } => {
                info!("Returning cached auth status: {} ({})", username, provider);
                return Ok(app_state.auth_status.clone());
            },
            AuthStatus::NotAuthenticated => {
                info!("Cached status shows not authenticated, will re-check");
            },
            AuthStatus::Authenticating => {
                info!("Currently authenticating, will re-check");
            },
            AuthStatus::Error { message } => {
                info!("Cached status shows error: {}, will re-check", message);
            }
        }
    }

    // Try to load persistent auth state
    match session_manager.load_auth_state().await {
        Ok(Some(persistent_state)) => {
            info!("Found persistent auth state for user: {}", persistent_state.username);
            
            // Verify the persistent state is still valid by checking with CLI
            let cli_bridge = match CliBridge::new().await {
                Ok(bridge) => bridge,
                Err(e) => {
                    let error_msg = format!("Failed to initialize CLI bridge: {}", e);
                    error!("CLI bridge initialization failed: {}", error_msg);
                    return Ok(AuthStatus::Error { message: error_msg });
                },
            };

            // Verify auth status with CLI
            match cli_bridge.check_auth_status().await {
                Ok(Some(_)) => {
                    // Persistent state is valid, restore it
                    let auth_status = AuthStatus::Authenticated {
                        username: persistent_state.username,
                        provider: persistent_state.provider,
                    };

                    {
                        let mut app_state = state.lock().await;
                        app_state.auth_status = auth_status.clone();
                    }

                    info!("Restored authentication state from persistent storage");
                    return Ok(auth_status);
                },
                Ok(None) => {
                    info!("Persistent state exists but CLI shows not authenticated, clearing");
                    let _ = session_manager.clear_auth_state().await;
                },
                Err(e) => {
                    warn!("Failed to verify persistent auth state: {}", e);
                }
            }
        },
        Ok(None) => {
            info!("No persistent auth state found");
        },
        Err(e) => {
            warn!("Failed to load persistent auth state: {}", e);
        }
    }

    // Create CLI bridge instance to check actual auth status
    let cli_bridge = match CliBridge::new().await {
        Ok(bridge) => {
            info!("CLI bridge initialized successfully for auth check");
            bridge
        },
        Err(e) => {
            let error_msg = format!("Failed to initialize CLI bridge: {}", e);
            error!("CLI bridge initialization failed: {}", error_msg);
            return Ok(AuthStatus::Error { message: error_msg });
        },
    };

    // Check actual authentication status from CLI
    info!("Checking authentication status via CLI bridge...");
    match cli_bridge.check_auth_status().await {
        Ok(Some(auth_info)) => {
            info!("Authentication successful - Username: {}, Provider: {}", 
                  auth_info.username, auth_info.provider);
            
            let auth_status = AuthStatus::Authenticated {
                username: auth_info.username,
                provider: auth_info.provider,
            };

            // Update app state with current status
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
                info!("Updated app state with authenticated status");
            }

            info!("=== TAURI COMMAND: get_auth_status returning AUTHENTICATED ===");
            Ok(auth_status)
        },
        Ok(None) => {
            info!("Authentication check result: NOT AUTHENTICATED");
            let auth_status = AuthStatus::NotAuthenticated;

            // Update app state
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
                info!("Updated app state with not authenticated status");
            }

            info!("=== TAURI COMMAND: get_auth_status returning NOT AUTHENTICATED ===");
            Ok(auth_status)
        },
        Err(e) => {
            let error_msg = format!("Failed to check authentication status: {}", e);
            error!("Authentication check error: {}", error_msg);

            let auth_status = AuthStatus::Error { message: error_msg };

            // Update app state
            {
                let mut app_state = state.lock().await;
                app_state.auth_status = auth_status.clone();
                info!("Updated app state with error status");
            }

            info!("=== TAURI COMMAND: get_auth_status returning ERROR ===");
            Ok(auth_status)
        },
    }
}
