/// File operation related Tauri commands

use std::path::Path;
use tauri::State;
use tracing::{info, error};

use super::{GuiError, FileContent};

/// Read file content command
#[tauri::command]
pub async fn read_file_content(
    file_path: String,
) -> Result<FileContent, String> {
    info!("Starting file read: {}", file_path);
    
    let path = Path::new(&file_path);
    
    // Check file existence
    if !path.exists() {
        let error_msg = format!("File does not exist: {}", file_path);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Check file size (avoid files that are too large)
    match std::fs::metadata(&path) {
        Ok(metadata) => {
            let file_size = metadata.len();
            
            // Reject files larger than 10MB
            if file_size > 10 * 1024 * 1024 {
                let error_msg = format!("File size too large: {} bytes", file_size);
                error!("{}", error_msg);
                return Err(error_msg);
            }
            
            // Read file content
            match tokio::fs::read_to_string(&path).await {
                Ok(content) => {
                    // Guess MIME type
                    let mime_type = guess_mime_type(&file_path);
                    
                    let file_content = FileContent {
                        path: file_path.clone(),
                        content,
                        size: file_size,
                        mime_type,
                    };
                    
                    info!("File read successful: {} ({} bytes)", file_path, file_size);
                    Ok(file_content)
                }
                Err(e) => {
                    let error_msg = format!("File read failed: {}", e);
                    error!("{}", error_msg);
                    Err(error_msg)
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to get file information: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Save file content command
#[tauri::command]
pub async fn save_file_content(
    file_path: String,
    content: String,
) -> Result<(), String> {
    info!("Starting file save: {}", file_path);
    
    let path = Path::new(&file_path);
    
    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            match tokio::fs::create_dir_all(parent).await {
                Ok(_) => {
                    info!("Created directory: {:?}", parent);
                }
                Err(e) => {
                    let error_msg = format!("Failed to create directory: {}", e);
                    error!("{}", error_msg);
                    return Err(error_msg);
                }
            }
        }
    }
    
    // Save file content
    match tokio::fs::write(&path, content.as_bytes()).await {
        Ok(_) => {
            info!("File save successful: {}", file_path);
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("File save failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Add file context command (for drag & drop)
#[tauri::command]
pub async fn add_file_context(
    file_name: String,
    content: String,
) -> Result<(), String> {
    info!("Adding file context: {}", file_name);
    
    // TODO: Use actual CLI bridge to add file context
    // Currently only logging
    info!("File context added: {} ({} characters)", file_name, content.len());
    
    Ok(())
}

/// Guess MIME type
fn guess_mime_type(file_path: &str) -> Option<String> {
    let path = Path::new(file_path);
    
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("txt") => Some("text/plain".to_string()),
        Some("md") => Some("text/markdown".to_string()),
        Some("rs") => Some("text/x-rust".to_string()),
        Some("js") => Some("text/javascript".to_string()),
        Some("ts") => Some("text/typescript".to_string()),
        Some("json") => Some("application/json".to_string()),
        Some("toml") => Some("application/toml".to_string()),
        Some("yaml") | Some("yml") => Some("application/yaml".to_string()),
        Some("html") => Some("text/html".to_string()),
        Some("css") => Some("text/css".to_string()),
        Some("py") => Some("text/x-python".to_string()),
        Some("java") => Some("text/x-java".to_string()),
        Some("cpp") | Some("cc") | Some("cxx") => Some("text/x-c++".to_string()),
        Some("c") => Some("text/x-c".to_string()),
        Some("h") => Some("text/x-c-header".to_string()),
        Some("go") => Some("text/x-go".to_string()),
        Some("php") => Some("text/x-php".to_string()),
        Some("rb") => Some("text/x-ruby".to_string()),
        Some("sh") => Some("text/x-shellscript".to_string()),
        Some("xml") => Some("application/xml".to_string()),
        _ => None,
    }
}