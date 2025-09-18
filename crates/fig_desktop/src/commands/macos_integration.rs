use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime, Emitter, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SystemTheme {
    Light,
    Dark,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacOSSystemInfo {
    pub theme: SystemTheme,
    pub accent_color: Option<String>,
    pub system_version: String,
}

/// Get current macOS system theme
#[command]
pub async fn get_system_theme() -> Result<SystemTheme, String> {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSApp;
        use cocoa::base::nil;
        use objc::{msg_send, sel, sel_impl};

        unsafe {
            let app = NSApp();
            let appearance: *mut objc::runtime::Object = msg_send![app, effectiveAppearance];
            
            if appearance != nil {
                let name: *mut objc::runtime::Object = msg_send![appearance, name];
                let name_string = cocoa::foundation::NSString::UTF8String(name);
                let name_str = std::ffi::CStr::from_ptr(name_string).to_str().unwrap_or("");
                
                if name_str.contains("Dark") {
                    return Ok(SystemTheme::Dark);
                }
            }
            
            Ok(SystemTheme::Light)
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(SystemTheme::Light)
    }
}

/// Get comprehensive macOS system information
#[command]
pub async fn get_macos_system_info() -> Result<MacOSSystemInfo, String> {
    let theme = get_system_theme().await?;
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Get system version
        let version_output = Command::new("sw_vers")
            .arg("-productVersion")
            .output()
            .map_err(|e| format!("Failed to get system version: {}", e))?;
        
        let system_version = String::from_utf8_lossy(&version_output.stdout)
            .trim()
            .to_string();
        
        Ok(MacOSSystemInfo {
            theme,
            accent_color: None, // TODO: Implement accent color detection
            system_version,
        })
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(MacOSSystemInfo {
            theme,
            accent_color: None,
            system_version: "Unknown".to_string(),
        })
    }
}

/// Open file or folder in Finder
#[command]
pub async fn reveal_in_finder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to reveal in Finder: {}", e))?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Finder integration is only available on macOS".to_string())
    }
}

/// Open file with default application
#[command]
pub async fn open_with_default_app(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open with default app: {}", e))?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("Default app integration is only available on macOS".to_string())
    }
}

/// Set up native menu bar for macOS
#[command]
pub async fn setup_native_menu<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    // 内部ロジックを呼び出し、エラーが発生した場合のみ文字列に変換
    setup_native_menu_inner(app).map_err(|e| {
        // anyhow::Errorはエラーチェーンを保持しているため、詳細な情報が得られる
        eprintln!("Error setting up native menu: {:?}", e); // サーバーサイドで詳細ログを出力
        e.to_string() // フロントエンドには簡潔なメッセージを返す
    })
}

/// 内部ロジック：anyhowでエラーを統一的に扱う
fn setup_native_menu_inner<R: Runtime>(app: AppHandle<R>) -> anyhow::Result<()> {
    #[cfg(target_os = "macos")]
    {
        use tauri::menu::{AboutMetadata, Menu, MenuItem, PredefinedMenuItem, Submenu};

        // Root menu for the app
        let root_menu = Menu::new(&app)?; // `?`がtauri::Errorをanyhow::Errorに自動変換

        // "Amazon Q Desktop" (App) submenu
        let app_menu = Submenu::new(&app, "Amazon Q Desktop", true)?;
        let about = PredefinedMenuItem::about(&app, Some("Amazon Q Desktop"), Some(AboutMetadata::default()))?;
        let sep1 = PredefinedMenuItem::separator(&app)?;
        let preferences = MenuItem::with_id(&app, "preferences", "Preferences...", true, None::<String>)?;
        let sep2 = PredefinedMenuItem::separator(&app)?;
        let services = PredefinedMenuItem::services(&app, None)?;
        let sep3 = PredefinedMenuItem::separator(&app)?;
        let hide = PredefinedMenuItem::hide(&app, None)?;
        let hide_others = PredefinedMenuItem::hide_others(&app, None)?;
        let show_all = PredefinedMenuItem::show_all(&app, None)?;
        let sep4 = PredefinedMenuItem::separator(&app)?;
        let quit = PredefinedMenuItem::quit(&app, None)?;
        app_menu.append(&about)?;
        app_menu.append(&sep1)?;
        app_menu.append(&preferences)?;
        app_menu.append(&sep2)?;
        app_menu.append(&services)?;
        app_menu.append(&sep3)?;
        app_menu.append(&hide)?;
        app_menu.append(&hide_others)?;
        app_menu.append(&show_all)?;
        app_menu.append(&sep4)?;
        app_menu.append(&quit)?;
        root_menu.append(&app_menu)?;

        // File submenu
        let file_menu = Submenu::new(&app, "File", true)?;
        let new_conversation = MenuItem::with_id(&app, "new_conversation", "New Conversation", true, Some("Cmd+N".to_string()))?;
        let sep_file_1 = PredefinedMenuItem::separator(&app)?;
        let open_file = MenuItem::with_id(&app, "open_file", "Open File...", true, Some("Cmd+O".to_string()))?;
        let save = MenuItem::with_id(&app, "save_conversation", "Save Conversation", true, Some("Cmd+S".to_string()))?;
        let sep_file_2 = PredefinedMenuItem::separator(&app)?;
        let close_window = PredefinedMenuItem::close_window(&app, None)?;
        file_menu.append(&new_conversation)?;
        file_menu.append(&sep_file_1)?;
        file_menu.append(&open_file)?;
        file_menu.append(&save)?;
        file_menu.append(&sep_file_2)?;
        file_menu.append(&close_window)?;
        root_menu.append(&file_menu)?;

        // Edit submenu
        let edit_menu = Submenu::new(&app, "Edit", true)?;
        let undo = PredefinedMenuItem::undo(&app, None)?;
        let redo = PredefinedMenuItem::redo(&app, None)?;
        let sep_edit = PredefinedMenuItem::separator(&app)?;
        let cut = PredefinedMenuItem::cut(&app, None)?;
        let copy = PredefinedMenuItem::copy(&app, None)?;
        let paste = PredefinedMenuItem::paste(&app, None)?;
        let select_all = PredefinedMenuItem::select_all(&app, None)?;
        edit_menu.append(&undo)?;
        edit_menu.append(&redo)?;
        edit_menu.append(&sep_edit)?;
        edit_menu.append(&cut)?;
        edit_menu.append(&copy)?;
        edit_menu.append(&paste)?;
        edit_menu.append(&select_all)?;
        root_menu.append(&edit_menu)?;

        // View submenu
        let view_menu = Submenu::new(&app, "View", true)?;
        let toggle_sidebar = MenuItem::with_id(&app, "toggle_sidebar", "Toggle Sidebar", true, Some("Cmd+Shift+S".to_string()))?;
        let toggle_fullscreen = MenuItem::with_id(&app, "toggle_fullscreen", "Enter Full Screen", true, Some("Ctrl+Cmd+F".to_string()))?;
        let sep_view = PredefinedMenuItem::separator(&app)?;
        let zoom_in = MenuItem::with_id(&app, "zoom_in", "Zoom In", true, Some("Cmd+Plus".to_string()))?;
        let zoom_out = MenuItem::with_id(&app, "zoom_out", "Zoom Out", true, Some("Cmd+Minus".to_string()))?;
        let actual_size = MenuItem::with_id(&app, "actual_size", "Actual Size", true, Some("Cmd+0".to_string()))?;
        view_menu.append(&toggle_sidebar)?;
        view_menu.append(&toggle_fullscreen)?;
        view_menu.append(&sep_view)?;
        view_menu.append(&zoom_in)?;
        view_menu.append(&zoom_out)?;
        view_menu.append(&actual_size)?;
        root_menu.append(&view_menu)?;

        // Window submenu
        let window_menu = Submenu::new(&app, "Window", true)?;
        let minimize = PredefinedMenuItem::minimize(&app, None)?;
        window_menu.append(&minimize)?;
        root_menu.append(&window_menu)?;

        // Help submenu
        let help_menu = Submenu::new(&app, "Help", true)?;
        let documentation = MenuItem::with_id(&app, "documentation", "Documentation", true, None::<String>)?;
        let keyboard_shortcuts = MenuItem::with_id(&app, "keyboard_shortcuts", "Keyboard Shortcuts", true, None::<String>)?;
        let sep_help = PredefinedMenuItem::separator(&app)?;
        let report_issue = MenuItem::with_id(&app, "report_issue", "Report Issue", true, None::<String>)?;
        help_menu.append(&documentation)?;
        help_menu.append(&keyboard_shortcuts)?;
        help_menu.append(&sep_help)?;
        help_menu.append(&report_issue)?;
        root_menu.append(&help_menu)?;

        app.set_menu(root_menu)?;
    }
    
    Ok(())
}

/// Check if VoiceOver is enabled
#[command]
pub async fn is_voice_over_enabled() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("defaults")
            .args(&["read", "com.apple.universalaccess", "voiceOverOnOffKey"])
            .output()
            .map_err(|e| format!("Failed to check VoiceOver status: {}", e))?;
        
        let result = String::from_utf8_lossy(&output.stdout);
        Ok(result.trim() == "1")
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(false)
    }
}

/// Check if high contrast mode is enabled
#[command]
pub async fn is_high_contrast_enabled() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let output = Command::new("defaults")
            .args(&["read", "com.apple.universalaccess", "increaseContrast"])
            .output()
            .map_err(|e| format!("Failed to check high contrast status: {}", e))?;
        
        let result = String::from_utf8_lossy(&output.stdout);
        Ok(result.trim() == "1")
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(false)
    }
}

/// Get system accessibility settings
#[command]
pub async fn get_accessibility_settings() -> Result<AccessibilitySettings, String> {
    let voice_over = is_voice_over_enabled().await?;
    let high_contrast = is_high_contrast_enabled().await?;
    
    Ok(AccessibilitySettings {
        voice_over_enabled: voice_over,
        high_contrast_enabled: high_contrast,
        zoom_enabled: false, // This would require more complex detection
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessibilitySettings {
    pub voice_over_enabled: bool,
    pub high_contrast_enabled: bool,
    pub zoom_enabled: bool,
}

/// Handle menu item clicks
#[command]
pub async fn handle_menu_event<R: Runtime>(
    app: AppHandle<R>,
    menu_id: String,
) -> Result<(), String> {
    match menu_id.as_str() {
        "preferences" => {
            // Emit event to frontend to show preferences
            app.emit("show_preferences", {})
                .map_err(|e| format!("Failed to emit preferences event: {}", e))?;
        }
        "new_conversation" => {
            app.emit("new_conversation", {})
                .map_err(|e| format!("Failed to emit new conversation event: {}", e))?;
        }
        "open_file" => {
            app.emit("open_file_dialog", {})
                .map_err(|e| format!("Failed to emit open file event: {}", e))?;
        }
        "save_conversation" => {
            app.emit("save_conversation", {})
                .map_err(|e| format!("Failed to emit save conversation event: {}", e))?;
        }
        "toggle_sidebar" => {
            app.emit("toggle_sidebar", {})
                .map_err(|e| format!("Failed to emit toggle sidebar event: {}", e))?;
        }
        "toggle_fullscreen" => {
            if let Some(window) = app.get_webview_window("main") {
                let is_fullscreen = window.is_fullscreen()
                    .map_err(|e| format!("Failed to check fullscreen status: {}", e))?;
                
                window.set_fullscreen(!is_fullscreen)
                    .map_err(|e| format!("Failed to toggle fullscreen: {}", e))?;
            }
        }
        "zoom_in" => {
            app.emit("zoom_in", {})
                .map_err(|e| format!("Failed to emit zoom in event: {}", e))?;
        }
        "zoom_out" => {
            app.emit("zoom_out", {})
                .map_err(|e| format!("Failed to emit zoom out event: {}", e))?;
        }
        "actual_size" => {
            app.emit("actual_size", {})
                .map_err(|e| format!("Failed to emit actual size event: {}", e))?;
        }
        "documentation" => {
            let _ = open_with_default_app("https://docs.aws.amazon.com/amazonq/".to_string()).await;
        }
        "keyboard_shortcuts" => {
            app.emit("show_keyboard_shortcuts", {})
                .map_err(|e| format!("Failed to emit keyboard shortcuts event: {}", e))?;
        }
        "report_issue" => {
            let _ = open_with_default_app("https://github.com/aws/amazon-q-developer-cli/issues".to_string()).await;
        }
        _ => {
            // Unknown menu item, ignore
        }
    }
    
    Ok(())
}