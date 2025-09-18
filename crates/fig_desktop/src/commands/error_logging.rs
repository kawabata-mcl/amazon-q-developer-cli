/// Error logging commands for the desktop application
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use time::OffsetDateTime;
use tracing::{error, info, warn};

#[derive(Debug, Serialize, Deserialize)]
pub struct LoggedError {
    pub id: String,
    pub error_type: String,
    pub message: String,
    pub details: Option<String>,
    pub timestamp: String,
    pub context: Option<serde_json::Value>,
    pub stack: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorLogEntry {
    pub timestamp: String,
    pub level: String,
    pub error: LoggedError,
    pub session_id: String,
    pub app_version: String,
}

/// Get the error log file path
fn get_error_log_path() -> Result<PathBuf, String> {
    let app_data_dir = dirs::data_dir()
        .ok_or("Failed to get data directory")?
        .join("amazon-q-desktop");

    let log_dir = app_data_dir.join("logs");
    
    // Create logs directory if it doesn't exist
    if !log_dir.exists() {
        std::fs::create_dir_all(&log_dir)
            .map_err(|e| format!("Failed to create logs directory: {}", e))?;
    }
    
    Ok(log_dir.join("error.log"))
}

/// Log error to file
#[tauri::command]
pub async fn log_error(error: LoggedError) -> Result<(), String> {
    info!("Logging error: {} - {}", error.error_type, error.message);
    
    let log_path = get_error_log_path()?;
    
    // Create error log entry
    let log_entry = ErrorLogEntry {
        timestamp: OffsetDateTime::now_utc().to_string(),
        level: determine_log_level(&error.error_type),
        error,
        session_id: get_session_id(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    };
    
    // Serialize to JSON
    let log_line = match serde_json::to_string(&log_entry) {
        Ok(json) => format!("{}\n", json),
        Err(e) => {
            error!("Failed to serialize error log entry: {}", e);
            return Err(format!("Failed to serialize error: {}", e));
        }
    };
    
    // Write to log file
    match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        Ok(mut file) => {
            if let Err(e) = file.write_all(log_line.as_bytes()) {
                error!("Failed to write to error log file: {}", e);
                return Err(format!("Failed to write to log file: {}", e));
            }
            
            if let Err(e) = file.flush() {
                warn!("Failed to flush error log file: {}", e);
            }
        }
        Err(e) => {
            error!("Failed to open error log file: {}", e);
            return Err(format!("Failed to open log file: {}", e));
        }
    }
    
    // Also log to tracing for immediate visibility
    match log_entry.level.as_str() {
        "ERROR" => error!("Frontend Error: {} - {}", log_entry.error.error_type, log_entry.error.message),
        "WARN" => warn!("Frontend Warning: {} - {}", log_entry.error.error_type, log_entry.error.message),
        _ => info!("Frontend Info: {} - {}", log_entry.error.error_type, log_entry.error.message),
    }
    
    info!("Successfully logged error to file: {:?}", log_path);
    Ok(())
}

/// Get error logs from file
#[tauri::command]
pub async fn get_error_logs(limit: Option<usize>) -> Result<Vec<ErrorLogEntry>, String> {
    info!("Getting error logs with limit: {:?}", limit);
    
    let log_path = get_error_log_path()?;
    
    if !log_path.exists() {
        info!("Error log file does not exist yet");
        return Ok(Vec::new());
    }
    
    let content = std::fs::read_to_string(&log_path)
        .map_err(|e| format!("Failed to read error log file: {}", e))?;
    
    let mut entries = Vec::new();
    
    for line in content.lines() {
        if line.trim().is_empty() {
            continue;
        }
        
        match serde_json::from_str::<ErrorLogEntry>(line) {
            Ok(entry) => entries.push(entry),
            Err(e) => {
                warn!("Failed to parse error log entry: {} - Line: {}", e, line);
            }
        }
    }
    
    // Sort by timestamp (most recent first)
    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    // Apply limit if specified
    if let Some(limit) = limit {
        entries.truncate(limit);
    }
    
    info!("Retrieved {} error log entries", entries.len());
    Ok(entries)
}

/// Clear error logs
#[tauri::command]
pub async fn clear_error_logs() -> Result<(), String> {
    info!("Clearing error logs");
    
    let log_path = get_error_log_path()?;
    
    if log_path.exists() {
        std::fs::remove_file(&log_path)
            .map_err(|e| format!("Failed to remove error log file: {}", e))?;
    }
    
    info!("Successfully cleared error logs");
    Ok(())
}

/// Get error log file size
#[tauri::command]
pub async fn get_error_log_size() -> Result<u64, String> {
    let log_path = get_error_log_path()?;
    
    if !log_path.exists() {
        return Ok(0);
    }
    
    let metadata = std::fs::metadata(&log_path)
        .map_err(|e| format!("Failed to get log file metadata: {}", e))?;
    
    Ok(metadata.len())
}

/// Determine log level based on error type
fn determine_log_level(error_type: &str) -> String {
    match error_type {
        "INITIALIZATION_ERROR" | "SYSTEM_ERROR" => "ERROR".to_string(),
        "AUTH_FAILED" | "AUTH_INVALID" | "NETWORK_OFFLINE" | "API_UNAVAILABLE" => "ERROR".to_string(),
        "AUTH_EXPIRED" | "NETWORK_ERROR" | "NETWORK_TIMEOUT" | "API_ERROR" => "WARN".to_string(),
        "SETTINGS_LOAD_FAILED" | "SETTINGS_SAVE_FAILED" | "CHAT_SEND_FAILED" => "WARN".to_string(),
        _ => "INFO".to_string(),
    }
}

/// Get or generate session ID
fn get_session_id() -> String {
    use std::sync::OnceLock;
    static SESSION_ID: OnceLock<String> = OnceLock::new();
    
    SESSION_ID.get_or_init(|| {
        use std::time::{SystemTime, UNIX_EPOCH};
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        format!("session_{}", timestamp)
    }).clone()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_determine_log_level() {
        assert_eq!(determine_log_level("INITIALIZATION_ERROR"), "ERROR");
        assert_eq!(determine_log_level("AUTH_EXPIRED"), "WARN");
        assert_eq!(determine_log_level("FILE_NOT_FOUND"), "INFO");
    }
    
    #[test]
    fn test_session_id_consistency() {
        let id1 = get_session_id();
        let id2 = get_session_id();
        assert_eq!(id1, id2);
        assert!(id1.starts_with("session_"));
    }
}