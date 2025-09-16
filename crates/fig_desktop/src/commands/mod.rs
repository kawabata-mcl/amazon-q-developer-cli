/// Tauri command module
/// 
/// This module provides Tauri commands for utilizing existing chat-cli
/// functionality from the GUI.

pub mod auth;
pub mod chat;
pub mod file_ops;
pub mod settings;
pub mod settings;

// Common error types and response types
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors that occur during GUI operations
#[derive(Error, Debug, Serialize)]
pub enum GuiError {
    #[error("CLI operation failed: {0}")]
    CliError(String),
    
    #[error("Authentication error: {0}")]
    AuthError(String),
    
    #[error("File operation error: {0}")]
    FileError(String),
    
    #[error("Network error: {0}")]
    NetworkError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
}

/// Chat response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    /// Conversation ID
    pub conversation_id: String,
    /// Response message
    pub message: String,
    /// Processing time in milliseconds
    pub processing_time_ms: u64,
    /// Model used
    pub model: Option<String>,
}

/// File read response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContent {
    /// File path
    pub path: String,
    /// File content
    pub content: String,
    /// File size in bytes
    pub size: u64,
    /// MIME type
    pub mime_type: Option<String>,
}