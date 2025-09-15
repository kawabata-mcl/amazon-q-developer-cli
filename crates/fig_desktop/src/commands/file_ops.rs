/// File operation related Tauri commands

use std::path::{Path, PathBuf};
use tracing::{info, error, warn};
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

use super::FileContent;
use crate::utils::cli_bridge::CliBridge;

/// Read file content command with enhanced security
#[tauri::command]
pub async fn read_file_content(
    file_path: String,
) -> Result<FileContent, String> {
    info!("Starting secure file read: {}", file_path);
    
    // Validate and sanitize file path
    let sanitized_path = match validate_and_sanitize_path(&file_path) {
        Ok(path) => path,
        Err(e) => {
            error!("Path validation failed: {}", e);
            return Err(format!("Invalid file path: {}", e));
        }
    };
    
    // Check file existence and permissions
    if !sanitized_path.exists() {
        let error_msg = format!("File does not exist: {}", sanitized_path.display());
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Security check: ensure it's a regular file, not a directory or special file
    if !sanitized_path.is_file() {
        let error_msg = format!("Path is not a regular file: {}", sanitized_path.display());
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Check file size and type restrictions
    match tokio::fs::metadata(&sanitized_path).await {
        Ok(metadata) => {
            let file_size = metadata.len();
            
            // Reject files larger than 10MB for security and performance
            const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;
            if file_size > MAX_FILE_SIZE {
                let error_msg = format!("File size too large: {} bytes (max: {} bytes)", file_size, MAX_FILE_SIZE);
                error!("{}", error_msg);
                return Err(error_msg);
            }
            
            // Check if file type is allowed
            if !is_allowed_file_type(&sanitized_path) {
                let error_msg = format!("File type not allowed: {}", sanitized_path.display());
                warn!("{}", error_msg);
                return Err(error_msg);
            }
            
            // Read file content with timeout
            match tokio::time::timeout(
                std::time::Duration::from_secs(30),
                tokio::fs::read_to_string(&sanitized_path)
            ).await {
                Ok(Ok(content)) => {
                    // Validate content (check for binary data)
                    if content.chars().any(|c| c.is_control() && c != '\n' && c != '\r' && c != '\t') {
                        let error_msg = "File appears to contain binary data";
                        warn!("{}: {}", error_msg, sanitized_path.display());
                        return Err(error_msg.to_string());
                    }
                    
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
                Ok(Err(e)) => {
                    let error_msg = format!("File read failed: {}", e);
                    error!("{}", error_msg);
                    Err(error_msg)
                }
                Err(_) => {
                    let error_msg = "File read timeout";
                    error!("{}: {}", error_msg, sanitized_path.display());
                    Err(error_msg.to_string())
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to get file metadata: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Save file content command with enhanced security
#[tauri::command]
pub async fn save_file_content(
    file_path: String,
    content: String,
) -> Result<(), String> {
    info!("Starting secure file save: {}", file_path);
    
    // Validate and sanitize file path
    let sanitized_path = match validate_and_sanitize_path(&file_path) {
        Ok(path) => path,
        Err(e) => {
            error!("Path validation failed: {}", e);
            return Err(format!("Invalid file path: {}", e));
        }
    };
    
    // Check content size limits
    const MAX_CONTENT_SIZE: usize = 10 * 1024 * 1024; // 10MB
    if content.len() > MAX_CONTENT_SIZE {
        let error_msg = format!("Content size too large: {} bytes (max: {} bytes)", content.len(), MAX_CONTENT_SIZE);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Check if file type is allowed for writing
    if !is_allowed_file_type(&sanitized_path) {
        let error_msg = format!("File type not allowed for writing: {}", sanitized_path.display());
        warn!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Create directory if it doesn't exist (with security checks)
    if let Some(parent) = sanitized_path.parent() {
        if !parent.exists() {
            // Validate parent directory path
            if let Err(e) = validate_directory_path(parent) {
                let error_msg = format!("Invalid parent directory: {}", e);
                error!("{}", error_msg);
                return Err(error_msg);
            }
            
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
    
    // Save file content with timeout
    match tokio::time::timeout(
        std::time::Duration::from_secs(30),
        tokio::fs::write(&sanitized_path, content.as_bytes())
    ).await {
        Ok(Ok(_)) => {
            info!("File save successful: {}", file_path);
            Ok(())
        }
        Ok(Err(e)) => {
            let error_msg = format!("File save failed: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
        Err(_) => {
            let error_msg = "File save timeout";
            error!("{}: {}", error_msg, sanitized_path.display());
            Err(error_msg.to_string())
        }
    }
}

/// Add file context command (for drag & drop) with CLI bridge integration
#[tauri::command]
pub async fn add_file_context(
    cli_bridge: State<'_, Arc<Mutex<CliBridge>>>,
    file_name: String,
    content: String,
) -> Result<(), String> {
    info!("Adding file context via CLI bridge: {}", file_name);
    
    // Validate content size
    const MAX_CONTENT_SIZE: usize = 10 * 1024 * 1024; // 10MB
    if content.len() > MAX_CONTENT_SIZE {
        let error_msg = format!("Content size too large: {} bytes (max: {} bytes)", content.len(), MAX_CONTENT_SIZE);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Validate file name
    if file_name.is_empty() || file_name.contains("..") || file_name.contains('\0') {
        let error_msg = "Invalid file name";
        error!("{}: {}", error_msg, file_name);
        return Err(error_msg.to_string());
    }
    
    // Create temporary file and add to context via CLI bridge
    let temp_dir = std::env::temp_dir();
    let temp_file_path = temp_dir.join(format!("q_gui_context_{}", file_name));
    
    // Write content to temporary file
    match tokio::fs::write(&temp_file_path, content.as_bytes()).await {
        Ok(_) => {
            let bridge = cli_bridge.lock().await;
            match bridge.add_file_to_context(temp_file_path.to_string_lossy().to_string()).await {
                Ok(_) => {
                    info!("File context added successfully: {} ({} characters)", file_name, content.len());
                    Ok(())
                }
                Err(e) => {
                    error!("Failed to add file to context: {}", e);
                    // Clean up temporary file
                    let _ = tokio::fs::remove_file(&temp_file_path).await;
                    Err(format!("Failed to add file to context: {}", e))
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to create temporary file: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Add file to context by path
#[tauri::command]
pub async fn add_file_to_context_by_path(
    cli_bridge: State<'_, Arc<Mutex<CliBridge>>>,
    file_path: String,
) -> Result<(), String> {
    info!("Adding file to context by path: {}", file_path);
    
    // Validate and sanitize file path
    let sanitized_path = match validate_and_sanitize_path(&file_path) {
        Ok(path) => path,
        Err(e) => {
            error!("Path validation failed: {}", e);
            return Err(format!("Invalid file path: {}", e));
        }
    };
    
    // Check file existence and type
    if !sanitized_path.exists() {
        let error_msg = format!("File does not exist: {}", sanitized_path.display());
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    if !sanitized_path.is_file() {
        let error_msg = format!("Path is not a regular file: {}", sanitized_path.display());
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // Check file type
    if !is_allowed_file_type(&sanitized_path) {
        let error_msg = format!("File type not allowed: {}", sanitized_path.display());
        warn!("{}", error_msg);
        return Err(error_msg);
    }
    
    let bridge = cli_bridge.lock().await;
    match bridge.add_file_to_context(file_path.clone()).await {
        Ok(_) => {
            info!("File added to context successfully: {}", file_path);
            Ok(())
        }
        Err(e) => {
            error!("Failed to add file to context: {}", e);
            Err(format!("Failed to add file to context: {}", e))
        }
    }
}

/// Get current context files
#[tauri::command]
pub async fn get_context_files(
    cli_bridge: State<'_, Arc<Mutex<CliBridge>>>,
) -> Result<Vec<(String, String)>, String> {
    info!("Getting context files via CLI bridge");
    
    let bridge = cli_bridge.lock().await;
    match bridge.get_context_files().await {
        Ok(files) => {
            info!("Retrieved {} context files", files.len());
            Ok(files)
        }
        Err(e) => {
            error!("Failed to get context files: {}", e);
            Err(format!("Failed to get context files: {}", e))
        }
    }
}

/// Remove file from context
#[tauri::command]
pub async fn remove_file_from_context(
    cli_bridge: State<'_, Arc<Mutex<CliBridge>>>,
    file_path: String,
) -> Result<(), String> {
    info!("Removing file from context: {}", file_path);
    
    let bridge = cli_bridge.lock().await;
    match bridge.remove_file_from_context(file_path.clone()).await {
        Ok(_) => {
            info!("File removed from context successfully: {}", file_path);
            Ok(())
        }
        Err(e) => {
            error!("Failed to remove file from context: {}", e);
            Err(format!("Failed to remove file from context: {}", e))
        }
    }
}

/// Clear all context files
#[tauri::command]
pub async fn clear_context(
    cli_bridge: State<'_, Arc<Mutex<CliBridge>>>,
) -> Result<(), String> {
    info!("Clearing all context files");
    
    let bridge = cli_bridge.lock().await;
    match bridge.clear_context().await {
        Ok(_) => {
            info!("All context files cleared successfully");
            Ok(())
        }
        Err(e) => {
            error!("Failed to clear context: {}", e);
            Err(format!("Failed to clear context: {}", e))
        }
    }
}

/// Validate and sanitize file path for security
fn validate_and_sanitize_path(file_path: &str) -> Result<PathBuf, String> {
    // Check for null bytes
    if file_path.contains('\0') {
        return Err("Path contains null bytes".to_string());
    }
    
    // Check for empty path
    if file_path.trim().is_empty() {
        return Err("Path is empty".to_string());
    }
    
    // Convert to PathBuf and canonicalize to resolve .. and . components
    let path = PathBuf::from(file_path);
    
    // Check for path traversal attempts
    if file_path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    
    // Check path length (prevent extremely long paths)
    if file_path.len() > 4096 {
        return Err("Path too long".to_string());
    }
    
    // On Unix systems, check for dangerous characters
    #[cfg(unix)]
    {
        if file_path.chars().any(|c| c.is_control() && c != '\t') {
            return Err("Path contains control characters".to_string());
        }
    }
    
    // On Windows, check for reserved names and characters
    #[cfg(windows)]
    {
        let reserved_names = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", 
                             "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", 
                             "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
        
        if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
            let name_upper = file_name.to_uppercase();
            if reserved_names.iter().any(|&reserved| name_upper.starts_with(reserved)) {
                return Err("Reserved file name not allowed".to_string());
            }
        }
        
        if file_path.chars().any(|c| "<>:\"|?*".contains(c)) {
            return Err("Path contains invalid characters".to_string());
        }
    }
    
    Ok(path)
}

/// Validate directory path for security
fn validate_directory_path(dir_path: &Path) -> Result<(), String> {
    // Check if path is absolute and within allowed directories
    let path_str = dir_path.to_string_lossy();
    
    // Prevent writing to system directories
    let forbidden_dirs = [
        "/etc", "/bin", "/sbin", "/usr/bin", "/usr/sbin", "/boot", "/sys", "/proc",
        "C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)", "C:\\System32"
    ];
    
    for forbidden in &forbidden_dirs {
        if path_str.starts_with(forbidden) {
            return Err(format!("Writing to system directory not allowed: {}", forbidden));
        }
    }
    
    Ok(())
}

/// Check if file type is allowed for reading/writing
fn is_allowed_file_type(path: &Path) -> bool {
    // Allow common text and code file extensions
    let allowed_extensions = [
        "txt", "md", "markdown", "rst", "adoc",
        "rs", "js", "ts", "jsx", "tsx", "vue", "svelte",
        "py", "rb", "go", "java", "kt", "scala", "clj", "hs",
        "c", "cpp", "cc", "cxx", "h", "hpp", "hxx",
        "cs", "fs", "vb", "php", "swift", "dart", "r",
        "json", "yaml", "yml", "toml", "ini", "cfg", "conf",
        "xml", "html", "htm", "css", "scss", "sass", "less",
        "sql", "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd",
        "dockerfile", "makefile", "cmake", "gradle", "maven",
        "log", "csv", "tsv", "properties", "env"
    ];
    
    match path.extension().and_then(|ext| ext.to_str()) {
        Some(ext) => {
            let ext_lower = ext.to_lowercase();
            allowed_extensions.contains(&ext_lower.as_str())
        }
        None => {
            // Allow files without extensions if they have common names
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                let name_lower = file_name.to_lowercase();
                matches!(name_lower.as_str(), 
                    "readme" | "license" | "changelog" | "makefile" | "dockerfile" |
                    "cargo.toml" | "package.json" | "tsconfig.json" | "eslint.config.js" |
                    ".gitignore" | ".gitattributes" | ".editorconfig" | ".env"
                )
            } else {
                false
            }
        }
    }
}

/// Guess MIME type based on file extension
fn guess_mime_type(file_path: &str) -> Option<String> {
    let path = Path::new(file_path);
    
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("txt") => Some("text/plain".to_string()),
        Some("md") | Some("markdown") => Some("text/markdown".to_string()),
        Some("rst") => Some("text/x-rst".to_string()),
        Some("adoc") => Some("text/asciidoc".to_string()),
        Some("rs") => Some("text/x-rust".to_string()),
        Some("js") => Some("text/javascript".to_string()),
        Some("ts") => Some("text/typescript".to_string()),
        Some("jsx") => Some("text/jsx".to_string()),
        Some("tsx") => Some("text/tsx".to_string()),
        Some("vue") => Some("text/x-vue".to_string()),
        Some("svelte") => Some("text/x-svelte".to_string()),
        Some("json") => Some("application/json".to_string()),
        Some("toml") => Some("application/toml".to_string()),
        Some("yaml") | Some("yml") => Some("application/yaml".to_string()),
        Some("ini") | Some("cfg") | Some("conf") => Some("text/plain".to_string()),
        Some("html") | Some("htm") => Some("text/html".to_string()),
        Some("css") => Some("text/css".to_string()),
        Some("scss") => Some("text/x-scss".to_string()),
        Some("sass") => Some("text/x-sass".to_string()),
        Some("less") => Some("text/x-less".to_string()),
        Some("py") => Some("text/x-python".to_string()),
        Some("rb") => Some("text/x-ruby".to_string()),
        Some("go") => Some("text/x-go".to_string()),
        Some("java") => Some("text/x-java".to_string()),
        Some("kt") => Some("text/x-kotlin".to_string()),
        Some("scala") => Some("text/x-scala".to_string()),
        Some("clj") => Some("text/x-clojure".to_string()),
        Some("hs") => Some("text/x-haskell".to_string()),
        Some("cpp") | Some("cc") | Some("cxx") => Some("text/x-c++".to_string()),
        Some("c") => Some("text/x-c".to_string()),
        Some("h") | Some("hpp") | Some("hxx") => Some("text/x-c-header".to_string()),
        Some("cs") => Some("text/x-csharp".to_string()),
        Some("fs") => Some("text/x-fsharp".to_string()),
        Some("vb") => Some("text/x-vb".to_string()),
        Some("php") => Some("text/x-php".to_string()),
        Some("swift") => Some("text/x-swift".to_string()),
        Some("dart") => Some("text/x-dart".to_string()),
        Some("r") => Some("text/x-r".to_string()),
        Some("sql") => Some("text/x-sql".to_string()),
        Some("sh") | Some("bash") | Some("zsh") | Some("fish") => Some("text/x-shellscript".to_string()),
        Some("ps1") => Some("text/x-powershell".to_string()),
        Some("bat") | Some("cmd") => Some("text/x-batch".to_string()),
        Some("xml") => Some("application/xml".to_string()),
        Some("log") => Some("text/x-log".to_string()),
        Some("csv") => Some("text/csv".to_string()),
        Some("tsv") => Some("text/tab-separated-values".to_string()),
        Some("properties") => Some("text/x-properties".to_string()),
        Some("env") => Some("text/x-env".to_string()),
        _ => None,
    }
}