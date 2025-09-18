use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{State, Emitter, Manager};
use tokio::sync::Mutex;
use std::sync::Arc;
use tauri::WebviewWindow;

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
    // Read previous settings for comparison, then update state
    let previous_settings = {
        let state = settings_state.lock().await;
        state.clone()
    };

    {
        let mut state = settings_state.lock().await;
        *state = settings.clone();
    }

    // Apply window settings immediately with loop-prevention and minimal changes
    if let Some(window) = app_handle.get_webview_window("main") {
        // Read current states
        let current_is_max = window
            .is_maximized()
            .map_err(|e| format!("Failed to get maximized state: {}", e))?;

        // First, reconcile maximize state to avoid resizing while maximized
        match (settings.window.maximized, current_is_max) {
            (true, false) => {
                if let Err(e) = window.maximize() {
                    eprintln!("Failed to maximize window: {}", e);
                }
            }
            (false, true) => {
                if let Err(e) = window.unmaximize() {
                    eprintln!("Failed to unmaximize window: {}", e);
                }
            }
            _ => {}
        }

        // Only size/position adjustments when not maximized
        if !settings.window.maximized {
            // Adjust size only if we need to enlarge to target to avoid shrink-thrashing
            if let Ok(current_size) = window.inner_size() {
                let need_enlarge = current_size.width < settings.window.width
                    || current_size.height < settings.window.height;
                if need_enlarge {
                    if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                        width: settings.window.width,
                        height: settings.window.height,
                    })) {
                        eprintln!("Failed to set window size: {}", e);
                    }
                }
            }

            // Apply window position if specified and changed
            if let (Some(x), Some(y)) = (settings.window.x, settings.window.y) {
                match window.outer_position() {
                    Ok(pos) if pos.x == x && pos.y == y => {}
                    _ => {
                        if let Err(e) = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y })) {
                            eprintln!("Failed to set window position: {}", e);
                        }
                    }
                }
            }
        }

        // Apply always-on-top only if changed from previous settings
        if settings.window.always_on_top != previous_settings.window.always_on_top {
            if let Err(e) = window.set_always_on_top(settings.window.always_on_top) {
                eprintln!("Failed to set always on top: {}", e);
            }
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

    // Apply default window settings (order: unmaximize -> size -> always-on-top)
    if let Some(window) = app_handle.get_webview_window("main") {
        if let Err(e) = window.unmaximize() {
            eprintln!("Failed to unmaximize window: {}", e);
        }

        if let Err(e) = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: default_settings.window.width,
            height: default_settings.window.height,
        })) {
            eprintln!("Failed to reset window size: {}", e);
        }

        if let Err(e) = window.set_always_on_top(false) {
            eprintln!("Failed to reset always on top: {}", e);
        }
    }

    // Save default settings to file
    save_settings_to_file(&default_settings).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_window_state(
    settings_state: State<'_, SettingsState>,
    app_handle: tauri::AppHandle,
) -> Result<WindowSettings, String> {
    let window = app_handle.get_webview_window("main")
        .ok_or("Main window not found")?;

    let size = window.inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    
    let position = window.outer_position()
        .map_err(|e| format!("Failed to get window position: {}", e))?;

    let is_maximized = window.is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    // Read additional flags from settings state
    let (always_on_top, remember_position) = {
        let settings = settings_state.lock().await;
        (settings.window.always_on_top, settings.window.remember_position)
    };

    Ok(WindowSettings {
        width: size.width,
        height: size.height,
        x: Some(position.x),
        y: Some(position.y),
        maximized: is_maximized,
        always_on_top,
        remember_position,
    })
}

// Internal helper to apply window settings to a given window
fn apply_window_settings_to_window(
    window: &WebviewWindow,
    settings: &WindowSettings,
    previous_always_on_top: Option<bool>,
) -> Result<(), String> {
    // Read current maximize state
    let current_is_max = window
        .is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    // Reconcile maximize state first
    match (settings.maximized, current_is_max) {
        (true, false) => {
            window.maximize().map_err(|e| format!("Failed to maximize window: {}", e))?;
        }
        (false, true) => {
            window.unmaximize().map_err(|e| format!("Failed to unmaximize window: {}", e))?;
        }
        _ => {}
    }

    // Only adjust size/position when not maximized
    if !settings.maximized {
        if let Ok(current_size) = window.inner_size() {
            let need_enlarge = current_size.width < settings.width
                || current_size.height < settings.height;
            if need_enlarge {
                window
                    .set_size(tauri::Size::Physical(tauri::PhysicalSize {
                        width: settings.width,
                        height: settings.height,
                    }))
                    .map_err(|e| format!("Failed to set window size: {}", e))?;
            }
        }

        if settings.remember_position {
            if let (Some(x), Some(y)) = (settings.x, settings.y) {
                match window.outer_position() {
                    Ok(pos) if pos.x == x && pos.y == y => {}
                    _ => {
                        window
                            .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
                            .map_err(|e| format!("Failed to set window position: {}", e))?;
                    }
                }
            }
        }
    }

    // Always-on-top apply; if previous provided, apply only when changed
    let should_apply_always_on_top = previous_always_on_top
        .map(|prev| prev != settings.always_on_top)
        .unwrap_or(true);
    if should_apply_always_on_top {
        window
            .set_always_on_top(settings.always_on_top)
            .map_err(|e| format!("Failed to set always on top: {}", e))?;
    }

    Ok(())
}

// Exposed for startup: apply settings once during setup
pub async fn apply_window_settings_at_startup(
    settings_state: SettingsState,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let settings = settings_state.lock().await.clone();
    if let Some(window) = app_handle.get_webview_window("main") {
        apply_window_settings_to_window(&window, &settings.window, None)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn save_window_state(
    settings_state: State<'_, SettingsState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Read current window and avoid persisting size/position while maximized
    let window = app_handle
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    let is_maximized = window
        .is_maximized()
        .map_err(|e| format!("Failed to get maximized state: {}", e))?;

    // Update settings with current window state
    {
        let mut settings = settings_state.lock().await;
        settings.window.maximized = is_maximized;

        if !is_maximized && settings.window.remember_position {
            let size = window
                .inner_size()
                .map_err(|e| format!("Failed to get window size: {}", e))?;
            let position = window
                .outer_position()
                .map_err(|e| format!("Failed to get window position: {}", e))?;

            settings.window.width = size.width;
            settings.window.height = size.height;
            settings.window.x = Some(position.x);
            settings.window.y = Some(position.y);
        }
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
    app_handle.emit("theme-changed", &theme)
        .map_err(|e| format!("Failed to emit theme change: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn register_global_shortcut(
    shortcut: String,
    action: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // TODO: Re-introduce global shortcuts using the Tauri v2 plugin when needed.
    let _ = (shortcut, action, app_handle);

    Ok(())
}

#[tauri::command]
pub async fn unregister_global_shortcut(
    shortcut: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // TODO: Re-introduce global shortcuts using the Tauri v2 plugin when needed.
    let _ = (shortcut, app_handle);

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
    let window = app_handle.get_webview_window("main")
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
        settings.window.maximized = is_maximized;

        if !is_maximized && settings.window.remember_position {
            settings.window.width = size.width;
            settings.window.height = size.height;
            settings.window.x = Some(position.x);
            settings.window.y = Some(position.y);
        }
    }

    // Save to file
    let settings = settings_state.lock().await.clone();
    save_settings_to_file(&settings).await?;

    Ok(())
}