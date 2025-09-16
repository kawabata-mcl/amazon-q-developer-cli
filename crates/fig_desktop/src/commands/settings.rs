use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;
use tokio::sync::Mutex;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub window: WindowSettings,
    pub keyboard: KeyboardSettings,
    pub general: GeneralSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    pub theme: String,
    #[serde(rename = "fontSize")]
    pub font_size: u32,
    #[serde(rename = "fontFamily")]
    pub font_family: String,
    #[serde(rename = "accentColor")]
    pub accent_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSettings {
    pub width: u32,
    pub height: u32,
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub maximized: bool,
    #[serde(rename = "alwaysOnTop")]
    pub always_on_top: bool,
    #[serde(rename = "rememberPosition")]
    pub remember_position: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardSettings {
    pub shortcuts: HashMap<String, String>,
    #[serde(rename = "enableGlobalShortcuts")]
    pub enable_global_shortcuts: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralSettings {
    #[serde(rename = "autoSave")]
    pub auto_save: bool,
    #[serde(rename = "autoSaveInterval")]
    pub auto_save_interval: u32,
    #[serde(rename = "maxConversationHistory")]
    pub max_conversation_history: u32,
    #[serde(rename = "enableNotifications")]
    pub enable_notifications: bool,
    pub language: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        let mut shortcuts = HashMap::new();
        shortcuts.insert("new-conversation".to_string(), "Cmd+N".to_string());
        shortcuts.insert("toggle-sidebar".to_string(), "Cmd+B".to_string());
        shortcuts.insert("search".to_string(), "Cmd+F".to_string());
        shortcuts.insert("settings".to_string(), "Cmd+,".to_string());
        shortcuts.insert("quit".to_string(), "Cmd+Q".to_string());

        Self {
            appearance: AppearanceSettings {
                theme: "system".to_string(),
                font_size: 14,
                font_family: "system-ui".to_string(),
                accent_color: "#3b82f6".to_string(),
            },
            window: WindowSettings {
                width: 1200,
                height: 800,
                x: None,
                y: None,
                maximized: false,
                always_on_top: false,
                remember_position: true,
            },
            keyboard: KeyboardSettings {
                shortcuts,
                enable_global_shortcuts: false,
            },
            general: GeneralSettings {
                auto_save: true,
                auto_save_interval: 30,
                max_conversation_history: 100,
                enable_notifications: true,
                language: "en".to_string(),
            },
        }
    }
}

pub type SettingsState = Arc<Mutex<AppSettings>>;

#[tauri::command]
pub async fn get_app_settings(
    settings_state: State<'_, SettingsState>,
) -> Result<AppSettings, String> {
    let settings = settings_state.lock().await;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn update_app_settings(
    settings: AppSettings,
    settings_state: State<'_, SettingsState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Update the state
    {
        let mut state = settings_state.lock().await;
        *state = settings.clone();
    }

    // Apply window settings immediately
    if let Some(window) = app_handle.get_window("main") {
        // Apply window size
        if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: settings.window.width,
            height: settings.window.height,
        })) {
            eprintln!("Failed to set window size: {}", e);
        }

        // Apply window position if specified
        if let (Some(x), Some(y)) = (settings.window.x, settings.window.y) {
            if let Err(e) = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x,
                y,
            })) {
                eprintln!("Failed to set window position: {}", e);
            }
        }

        // Apply maximized state
        if settings.window.maximized {
            if let Err(e) = window.maximize() {
                eprintln!("Failed to maximize window: {}", e);
            }
        } else {
            if let Err(e) = window.unmaximize() {
                eprintln!("Failed to unmaximize window: {}", e);
            }
        }

        // Apply always on top
        if let Err(e) = window.set_always_on_top(settings.window.always_on_top) {
            eprintln!("Failed to set always on top: {}", e);
        }
    }

    // Save settings to file
    save_settings_to_file(&settings).await?;

    Ok(())
}

#[tauri::command]
pub async fn reset_app_settings(
    settings_state: State<'_, SettingsState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let default_settings = AppSettings::default();
    
    // Update the state
    {
        let mut state = settings_state.lock().await;
        *state = default_settings.clone();
    }

    // Apply default window settings
    if let Some(window) = app_handle.get_window("main") {
        if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: default_settings.window.width,
            height: default_settings.window.height,
        })) {
            eprintln!("Failed to reset window size: {}", e);
        }

        if let Err(e) = window.set_always_on_top(false) {
            eprintln!("Failed to reset always on top: {}", e);
        }

        if let Err(e) = window.unmaximize() {
            eprintln!("Failed to unmaximize window: {}", e);
        }
    }

    // Save default settings to file
    save_settings_to_file(&default_settings).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_window_state(
    app_handle: tauri::AppHandle,
) -> Result<WindowSettings, String> {
    let window = app_handle.get_window("main")
        .ok_or("Main window not found")?;

    let size = window.inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    
    let position = window.outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;

    let is_maximized = window.is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    Ok(WindowSettings {
        width: size.width,
        height: size.height,
        x: Some(position.x),
        y: Some(position.y),
        maximized: is_maximized,
        always_on_top: false, // This would need to be tracked separately
        remember_position: true,
    })
}

#[tauri::command]
pub async fn save_window_state(
    settings_state: State<'_, SettingsState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let window_state = get_window_state(app_handle).await?;
    
    // Update settings with current window state
    {
        let mut settings = settings_state.lock().await;
        settings.window = window_state;
    }

    // Save to file
    let settings = settings_state.lock().await.clone();
    save_settings_to_file(&settings).await?;

    Ok(())
}

#[tauri::command]
pub async fn apply_theme(
    theme: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Emit theme change event to frontend
    app_handle.emit_all("theme-changed", &theme)
        .map_err(|e| format!("Failed to emit theme change: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn register_global_shortcut(
    shortcut: String,
    action: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::GlobalShortcutManager;
    
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    
    // Unregister existing shortcut if it exists
    if shortcut_manager.is_registered(&shortcut).unwrap_or(false) {
        shortcut_manager.unregister(&shortcut)
            .map_err(|e| format!("Failed to unregister shortcut: {}", e))?;
    }
    
    // Register new shortcut
    let action_clone = action.clone();
    shortcut_manager.register(&shortcut, move || {
        // Handle shortcut action
        println!("Global shortcut triggered: {}", action_clone);
    })
    .map_err(|e| format!("Failed to register global shortcut: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn unregister_global_shortcut(
    shortcut: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::GlobalShortcutManager;
    
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    
    if shortcut_manager.is_registered(&shortcut).unwrap_or(false) {
        shortcut_manager.unregister(&shortcut)
            .map_err(|e| format!("Failed to unregister shortcut: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn quit_app(
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    app_handle.exit(0);
    Ok(())
}

async fn save_settings_to_file(settings: &AppSettings) -> Result<(), String> {
    use std::path::PathBuf;
    use tokio::fs;

    // Get the app data directory
    let app_data_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("amazon-q-desktop");

    // Create directory if it doesn't exist
    fs::create_dir_all(&app_data_dir).await
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let settings_file = app_data_dir.join("settings.json");
    let settings_json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(settings_file, settings_json).await
        .map_err(|e| format!("Failed to write settings file: {}", e))?;

    Ok(())
}

pub async fn load_settings_from_file() -> Result<AppSettings, String> {
    use std::path::PathBuf;
    use tokio::fs;

    let app_data_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?
        .join("amazon-q-desktop");

    let settings_file = app_data_dir.join("settings.json");

    if !settings_file.exists() {
        // Return default settings if file doesn't exist
        return Ok(AppSettings::default());
    }

    let settings_json = fs::read_to_string(settings_file).await
        .map_err(|e| format!("Failed to read settings file: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&settings_json)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    Ok(settings)
}

// Internal function for auto-saving window state
pub async fn save_window_state_internal(
    settings_state: SettingsState,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let window = app_handle.get_window("main")
        .ok_or("Main window not found")?;

    let size = window.inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    
    let position = window.outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;

    let is_maximized = window.is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    // Update settings with current window state
    {
        let mut settings = settings_state.lock().await;
        if settings.window.remember_position {
            settings.window.width = size.width;
            settings.window.height = size.height;
            settings.window.x = Some(position.x);
            settings.window.y = Some(position.y);
            settings.window.maximized = is_maximized;
        }
    }

    // Save to file
    let settings = settings_state.lock().await.clone();
    save_settings_to_file(&settings).await?;

    Ok(())
}