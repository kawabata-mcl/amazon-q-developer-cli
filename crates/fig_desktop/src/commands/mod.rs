/// Tauriコマンドモジュール
/// 
/// このモジュールは既存のchat-cli機能をGUIから利用するための
/// Tauriコマンドを提供します。

pub mod auth;
pub mod chat;
pub mod file_ops;
pub mod settings;

// 共通のエラー型とレスポンス型
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// GUI操作で発生するエラー
#[derive(Error, Debug, Serialize)]
pub enum GuiError {
    #[error("CLI操作が失敗しました: {0}")]
    CliError(String),
    
    #[error("認証エラー: {0}")]
    AuthError(String),
    
    #[error("ファイル操作エラー: {0}")]
    FileError(String),
    
    #[error("ネットワークエラー: {0}")]
    NetworkError(String),
    
    #[error("設定エラー: {0}")]
    ConfigError(String),
    
    #[error("内部エラー: {0}")]
    InternalError(String),
}

/// チャット応答
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    /// 会話ID
    pub conversation_id: String,
    /// 応答メッセージ
    pub message: String,
    /// 処理時間（ミリ秒）
    pub processing_time_ms: u64,
    /// 使用されたモデル
    pub model: Option<String>,
}

/// ファイル読み込み応答
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContent {
    /// ファイルパス
    pub path: String,
    /// ファイル内容
    pub content: String,
    /// ファイルサイズ（バイト）
    pub size: u64,
    /// MIME タイプ
    pub mime_type: Option<String>,
}