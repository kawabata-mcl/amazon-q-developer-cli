/// Settings-related Tauri commands

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use tracing::{info, error};

use crate::state::{AppState, AppSettings};
use super::GuiError;

/// Get settings command
#[tauri::command]
pub async fn get_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AppSettings, String> {
    let app_state = state.lock().await;
    info!("Retrieved settings");
    Ok(app_state.settings.clone())
}

/// Update settings command
#[tauri::command]
pub async fn update_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
    settings: AppSettings,
) -> Result<(), String> {
    info!("Updating settings");
    
    // Validate settings
    if let Err(validation_error) = validate_settings(&settings) {
        let error_msg = format!("Invalid settings: {}", validation_error);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Update settings
    {
        let mut app_state = state.lock().await;
        app_state.settings = settings;
    }
    
    // TODO: Persist settings to file
    // Currently only in-memory updates
    
    info!("Settings update completed");
    Ok(())
}

/// Update window settings command
#[tauri::command]
pub async fn update_window_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
    width: u32,
    height: u32,
    x: Option<i32>,
    y: Option<i32>,
    maximized: bool,
) -> Result<(), String> {
    info!("Updating window settings: {}x{}", width, height);
    
    {
        let mut app_state = state.lock().await;
        app_state.settings.window_settings.width = width;
        app_state.settings.window_settings.height = height;
        app_state.settings.window_settings.x = x;
        app_state.settings.window_settings.y = y;
        app_state.settings.window_settings.maximized = maximized;
    }
    
    info!("Window settings update completed");
    Ok(())
}

/// Update theme settings command
#[tauri::command]
pub async fn update_theme(
    state: State<'_, Arc<Mutex<AppState>>>,
    theme: crate::state::Theme,
) -> Result<(), String> {
    info!("Updating theme settings: {:?}", theme);
    
    {
        let mut app_state = state.lock().await;
        app_state.settings.appearance.theme = theme;
    }
    
    info!("Theme settings update completed");
    Ok(())
}

/// Reset settings command
#[tauri::command]
pub async fn reset_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AppSettings, String> {
    info!("Resetting settings");
    
    let default_settings = AppSettings::default();
    
    {
        let mut app_state = state.lock().await;
        app_state.settings = default_settings.clone();
    }
    
    info!("Settings reset completed");
    Ok(default_settings)
}

/// Validate settings
fn validate_settings(settings: &AppSettings) -> Result<(), String> {
    // Window size validation
    if settings.window_settings.width < 400 {
        return Err("Window width must be at least 400px".to_string());
    }
    
    if settings.window_settings.height < 300 {
        return Err("Window height must be at least 300px".to_string());
    }
    
    // Font size validation
    if settings.appearance.font_size < 8 || settings.appearance.font_size > 72 {
        return Err("Font size must be between 8px and 72px".to_string());
    }
    
    // History count validation
    if settings.chat_settings.max_history_count > 1000 {
        return Err("Maximum history count must be 1000 or less".to_string());
    }
    
    Ok(())
}