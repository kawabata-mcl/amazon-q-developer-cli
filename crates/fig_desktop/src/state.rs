use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use time::OffsetDateTime;
use uuid::Uuid;

/// アプリケーション全体の状態を管理する構造体
#[derive(Debug, Clone)]
pub struct AppState {
    /// 現在の認証状態
    pub auth_status: AuthStatus,
    /// アクティブな会話のID
    pub current_conversation_id: Option<String>,
    /// 会話履歴
    pub conversations: HashMap<String, GuiConversationState>,
    /// アプリケーション設定
    pub settings: AppSettings,
}

impl AppState {
    /// 新しいAppStateインスタンスを作成
    pub fn new() -> Self {
        Self {
            auth_status: AuthStatus::NotAuthenticated,
            current_conversation_id: None,
            conversations: HashMap::new(),
            settings: AppSettings::default(),
        }
    }

    /// 新しい会話を開始
    pub fn start_new_conversation(&mut self) -> String {
        let conversation_id = Uuid::new_v4().to_string();
        let conversation = GuiConversationState {
            id: conversation_id.clone(),
            title: "新しい会話".to_string(),
            messages: Vec::new(),
            agent: None,
            model: None,
            created_at: OffsetDateTime::now_utc(),
            updated_at: OffsetDateTime::now_utc(),
        };

        self.conversations.insert(conversation_id.clone(), conversation);
        self.current_conversation_id = Some(conversation_id.clone());
        
        conversation_id
    }

    /// 会話にメッセージを追加
    pub fn add_message_to_conversation(&mut self, conversation_id: &str, message: GuiMessage) {
        if let Some(conversation) = self.conversations.get_mut(conversation_id) {
            conversation.messages.push(message);
            conversation.updated_at = OffsetDateTime::now_utc();
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// 認証状態を表す列挙型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthStatus {
    /// 未認証
    NotAuthenticated,
    /// 認証中
    Authenticating,
    /// 認証済み
    Authenticated {
        /// ユーザー名
        username: String,
        /// 認証プロバイダー
        provider: String,
    },
    /// 認証エラー
    Error {
        /// エラーメッセージ
        message: String,
    },
}

/// GUI用の会話状態
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiConversationState {
    /// 会話ID
    pub id: String,
    /// 会話タイトル
    pub title: String,
    /// メッセージリスト
    pub messages: Vec<GuiMessage>,
    /// 使用中のエージェント
    pub agent: Option<String>,
    /// 使用中のモデル
    pub model: Option<String>,
    /// 作成日時
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    /// 更新日時
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

/// GUI用のメッセージ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiMessage {
    /// メッセージID
    pub id: String,
    /// メッセージの役割
    pub role: MessageRole,
    /// メッセージ内容
    pub content: String,
    /// タイムスタンプ
    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: OffsetDateTime,
    /// ツール使用情報
    pub tool_uses: Vec<GuiToolUse>,
    /// メタデータ
    pub metadata: Option<MessageMetadata>,
}

/// メッセージの役割
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    /// ユーザーメッセージ
    User,
    /// アシスタントメッセージ
    Assistant,
    /// システムメッセージ
    System,
}

/// GUI用のツール使用情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GuiToolUse {
    /// ツール名
    pub tool_name: String,
    /// 入力パラメータ
    pub input: serde_json::Value,
    /// 出力結果
    pub output: Option<serde_json::Value>,
    /// 実行状態
    pub status: ToolUseStatus,
}

/// ツール使用の状態
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToolUseStatus {
    /// 実行中
    Running,
    /// 成功
    Success,
    /// エラー
    Error { message: String },
}

/// メッセージのメタデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageMetadata {
    /// トークン数
    pub token_count: Option<u32>,
    /// 処理時間（ミリ秒）
    pub processing_time_ms: Option<u64>,
    /// モデル情報
    pub model_info: Option<String>,
}

/// アプリケーション設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// ウィンドウ設定
    pub window_settings: WindowSettings,
    /// チャット設定
    pub chat_settings: ChatSettings,
    /// 外観設定
    pub appearance: AppearanceSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            window_settings: WindowSettings::default(),
            chat_settings: ChatSettings::default(),
            appearance: AppearanceSettings::default(),
        }
    }
}

/// ウィンドウ設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSettings {
    /// ウィンドウ幅
    pub width: u32,
    /// ウィンドウ高さ
    pub height: u32,
    /// X座標
    pub x: Option<i32>,
    /// Y座標
    pub y: Option<i32>,
    /// 最大化状態
    pub maximized: bool,
}

impl Default for WindowSettings {
    fn default() -> Self {
        Self {
            width: 1200,
            height: 800,
            x: None,
            y: None,
            maximized: false,
        }
    }
}

/// チャット設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSettings {
    /// デフォルトモデル
    pub default_model: Option<String>,
    /// デフォルトエージェント
    pub default_agent: Option<String>,
    /// 自動保存設定
    pub auto_save: bool,
    /// 最大履歴数
    pub max_history_count: u32,
}

impl Default for ChatSettings {
    fn default() -> Self {
        Self {
            default_model: None,
            default_agent: None,
            auto_save: true,
            max_history_count: 100,
        }
    }
}

/// 外観設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    /// テーマ
    pub theme: Theme,
    /// フォントサイズ
    pub font_size: u32,
    /// フォントファミリー
    pub font_family: String,
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            theme: Theme::Auto,
            font_size: 14,
            font_family: "system-ui".to_string(),
        }
    }
}

/// テーマ設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    /// ライトテーマ
    Light,
    /// ダークテーマ
    Dark,
    /// システム設定に従う
    Auto,
}