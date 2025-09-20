// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error};

// Make available as library as well
pub mod commands;
pub mod state;
pub mod utils;

use commands::*;
use state::AppState;
use utils::cli_bridge::CliBridge;
use crate::commands::settings::apply_window_settings_at_startup;

/// Main function for the Tauri application
#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    info!("Starting Amazon Q Desktop application");

    // Initialize application state
    let app_state = Arc::new(Mutex::new(AppState::new()));
    
    // Initialize CLI bridge
    let cli_bridge = match CliBridge::new().await {
        Ok(bridge) => Arc::new(Mutex::new(bridge)),
        Err(e) => {
            eprintln!("Failed to initialize CLI bridge: {}", e);
            std::process::exit(1);
        }
    };

    // Initialize settings state
    let settings_state = match settings::load_settings_from_file().await {
        Ok(settings) => Arc::new(Mutex::new(settings)),
        Err(e) => {
            eprintln!("Failed to load settings, using defaults: {}", e);
            Arc::new(Mutex::new(settings::AppSettings::default()))
        }
    };

    // Build and run Tauri application
    tauri::Builder::default()
        .manage(app_state.clone())
        .manage(cli_bridge.clone())
        .manage(settings_state.clone())
        .invoke_handler(tauri::generate_handler![
            // Authentication commands
            auth::login,
            auth::logout,
            auth::get_auth_status,
            auth::refresh_auth_token,
            // Chat commands
            chat::send_message,
            chat::send_message_stream,
            chat::get_conversation_history,
            chat::start_new_conversation,
            chat::get_all_conversations,
            chat::delete_conversation,
            chat::rename_conversation,
            chat::search_conversations,
            chat::get_conversation_stats,
            // File operation commands
            file_ops::read_file_content,
            file_ops::save_file_content,
            file_ops::add_file_context,
            file_ops::add_file_to_context_by_path,
            file_ops::get_context_files,
            file_ops::remove_file_from_context,
            file_ops::clear_context,
            // Settings commands
            settings::get_app_settings,
            settings::update_app_settings,
            settings::reset_app_settings,
            settings::get_window_state,
            settings::save_window_state,
            settings::apply_theme,
            settings::register_global_shortcut,
            settings::unregister_global_shortcut,
            settings::quit_app,
            // Error logging commands
            error_logging::log_error,
            error_logging::get_error_logs,
            error_logging::clear_error_logs,
            error_logging::get_error_log_size,
            // macOS integration commands
            macos_integration::get_system_theme,
            macos_integration::get_macos_system_info,
            macos_integration::reveal_in_finder,
            macos_integration::open_with_default_app,
            macos_integration::setup_native_menu,
            macos_integration::handle_menu_event,
            macos_integration::is_voice_over_enabled,
            macos_integration::is_high_contrast_enabled,
            macos_integration::get_accessibility_settings
        ])
        .setup(move |app| {
            info!("Tauri application setup completed");
            
            // Apply window settings once at startup to avoid FE/BE race
            {
                let app_handle = app.handle().clone();
                let settings_state_for_startup = settings_state.clone();
                tokio::spawn(async move {
                    if let Err(e) = apply_window_settings_at_startup(settings_state_for_startup, app_handle).await {
                        error!("Failed to apply window settings at startup: {}", e);
                    }
                });
            }

            // Perform initial authentication check
            let app_state_clone = app_state.clone();
            let cli_bridge_clone = cli_bridge.clone();
            tokio::spawn(async move {
                info!("Performing initial authentication check...");
                
                let bridge = cli_bridge_clone.lock().await;
                match bridge.check_auth_status().await {
                    Ok(Some(auth_info)) => {
                        info!("Initial auth check: User is authenticated - {}", auth_info.username);
                        let mut state = app_state_clone.lock().await;
                        state.auth_status = state::AuthStatus::Authenticated {
                            username: auth_info.username,
                            provider: auth_info.provider,
                        };
                    },
                    Ok(None) => {
                        info!("Initial auth check: User is not authenticated");
                        let mut state = app_state_clone.lock().await;
                        state.auth_status = state::AuthStatus::NotAuthenticated;
                    },
                    Err(e) => {
                        error!("Initial auth check failed: {}", e);
                        let mut state = app_state_clone.lock().await;
                        state.auth_status = state::AuthStatus::Error {
                            message: format!("Initial auth check failed: {}", e),
                        };
                    }
                }
            });
            
            // Setup window event listeners for auto-saving window state (disabled to prevent resize loops)
            // TODO: Re-enable with proper debouncing and loop prevention
            /*
            let app_handle = app.handle();
            let settings_state_clone = settings_state.clone();
            
            if let Some(window) = app.get_webview_window("main") {
                let app_handle_clone = app_handle.clone();
                let settings_state_clone2 = settings_state_clone.clone();
                
                // Listen for window resize events
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Resized(_) | 
                        tauri::WindowEvent::Moved(_) => {
                            let app_handle = app_handle_clone.clone();
                            let settings_state = settings_state_clone2.clone();
                            
                            // Save window state after a short delay to avoid excessive saves
                            tokio::spawn(async move {
                                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                                if let Err(e) = save_window_state_internal(settings_state, app_handle).await {
                                    eprintln!("Failed to auto-save window state: {}", e);
                                }
                            });
                        }
                        _ => {}
                    }
                });
            }
            */
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error occurred while running Tauri application");
}
