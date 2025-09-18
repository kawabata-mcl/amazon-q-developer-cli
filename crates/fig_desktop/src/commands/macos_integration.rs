use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager, Runtime};

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
        use cocoa::appkit::{NSApp, NSAppearance, NSAppearanceNameAqua, NSAppearanceNameDarkAqua};
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
    #[cfg(target_os = "macos")]
    {
        use tauri::{Menu, MenuItem, Submenu, CustomMenuItem, AboutMetadata};
        
        // Create About menu item
        let about_menu = Submenu::new(
            "Amazon Q Desktop",
            Menu::new()
                .add_native_item(MenuItem::About("Amazon Q Desktop".to_string(), AboutMetadata::default()))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("preferences", "Preferences...").accelerator("Cmd+,"))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Services)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        );
        
        // Create File menu
        let file_menu = Submenu::new(
            "File",
            Menu::new()
                .add_item(CustomMenuItem::new("new_conversation", "New Conversation").accelerator("Cmd+N"))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("open_file", "Open File...").accelerator("Cmd+O"))
                .add_item(CustomMenuItem::new("save_conversation", "Save Conversation").accelerator("Cmd+S"))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::CloseWindow),
        );
        
        // Create Edit menu
        let edit_menu = Submenu::new(
            "Edit",
            Menu::new()
                .add_native_item(MenuItem::Undo)
                .add_native_item(MenuItem::Redo)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Cut)
                .add_native_item(MenuItem::Copy)
                .add_native_item(MenuItem::Paste)
                .add_native_item(MenuItem::SelectAll),
        );
        
        // Create View menu
        let view_menu = Submenu::new(
            "View",
            Menu::new()
                .add_item(CustomMenuItem::new("toggle_sidebar", "Toggle Sidebar").accelerator("Cmd+Shift+S"))
                .add_item(CustomMenuItem::new("toggle_fullscreen", "Enter Full Screen").accelerator("Ctrl+Cmd+F"))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("zoom_in", "Zoom In").accelerator("Cmd+Plus"))
                .add_item(CustomMenuItem::new("zoom_out", "Zoom Out").accelerator("Cmd+Minus"))
                .add_item(CustomMenuItem::new("actual_size", "Actual Size").accelerator("Cmd+0")),
        );
        
        // Create Window menu
        let window_menu = Submenu::new(
            "Window",
            Menu::new()
                .add_native_item(MenuItem::Minimize)
                .add_native_item(MenuItem::Zoom),
        );
        
        // Create Help menu
        let help_menu = Submenu::new(
            "Help",
            Menu::new()
                .add_item(CustomMenuItem::new("documentation", "Documentation"))
                .add_item(CustomMenuItem::new("keyboard_shortcuts", "Keyboard Shortcuts"))
                .add_native_item(MenuItem::Separator)
                .add_item(CustomMenuItem::new("report_issue", "Report Issue")),
        );
        
        // Build the complete menu
        let menu = Menu::new()
            .add_submenu(about_menu)
            .add_submenu(file_menu)
            .add_submenu(edit_menu)
            .add_submenu(view_menu)
            .add_submenu(window_menu)
            .add_submenu(help_menu);
        
        app.set_menu(menu)
            .map_err(|e| format!("Failed to set native menu: {}", e))?;
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(())
    }
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
            app.emit_all("show_preferences", {})
                .map_err(|e| format!("Failed to emit preferences event: {}", e))?;
        }
        "new_conversation" => {
            app.emit_all("new_conversation", {})
                .map_err(|e| format!("Failed to emit new conversation event: {}", e))?;
        }
        "open_file" => {
            app.emit_all("open_file_dialog", {})
                .map_err(|e| format!("Failed to emit open file event: {}", e))?;
        }
        "save_conversation" => {
            app.emit_all("save_conversation", {})
                .map_err(|e| format!("Failed to emit save conversation event: {}", e))?;
        }
        "toggle_sidebar" => {
            app.emit_all("toggle_sidebar", {})
                .map_err(|e| format!("Failed to emit toggle sidebar event: {}", e))?;
        }
        "toggle_fullscreen" => {
            if let Some(window) = app.get_window("main") {
                let is_fullscreen = window.is_fullscreen()
                    .map_err(|e| format!("Failed to check fullscreen status: {}", e))?;
                
                window.set_fullscreen(!is_fullscreen)
                    .map_err(|e| format!("Failed to toggle fullscreen: {}", e))?;
            }
        }
        "zoom_in" => {
            app.emit_all("zoom_in", {})
                .map_err(|e| format!("Failed to emit zoom in event: {}", e))?;
        }
        "zoom_out" => {
            app.emit_all("zoom_out", {})
                .map_err(|e| format!("Failed to emit zoom out event: {}", e))?;
        }
        "actual_size" => {
            app.emit_all("actual_size", {})
                .map_err(|e| format!("Failed to emit actual size event: {}", e))?;
        }
        "documentation" => {
            let _ = open_with_default_app("https://docs.aws.amazon.com/amazonq/".to_string()).await;
        }
        "keyboard_shortcuts" => {
            app.emit_all("show_keyboard_shortcuts", {})
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