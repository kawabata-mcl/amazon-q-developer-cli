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

/// Main function for the Tauri application
#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    info!("Starting Amazon Q Desktop application");

    // Initialize application state
    let app_state = Arc::new(Mutex::new(AppState::new()));

    // Build and run Tauri application
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Authentication commands
            auth::login,
            auth::logout,
            auth::get_auth_status,
            // Chat commands
            chat::send_message,
            chat::get_conversation_history,
            chat::start_new_conversation,
            chat::get_all_conversations,
            chat::delete_conversation,
            // File operation commands
            file_ops::read_file_content,
            file_ops::save_file_content,
            file_ops::add_file_context,
            // Settings commands
            settings::get_settings,
            settings::update_settings,
            settings::update_window_settings,
            settings::update_theme,
            settings::reset_settings
        ])
        .setup(|app| {
            info!("Tauri application setup completed");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error occurred while running Tauri application");
}