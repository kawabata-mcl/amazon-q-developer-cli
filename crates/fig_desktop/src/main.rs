// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error};

// ライブラリとしても使用可能にする
pub mod commands;
pub mod state;
pub mod utils;

use commands::*;
use state::AppState;

/// Tauriアプリケーションのメイン関数
#[tokio::main]
async fn main() {
    // ログ初期化
    tracing_subscriber::fmt::init();
    
    info!("Amazon Q Desktop アプリケーションを開始します");

    // アプリケーション状態の初期化
    let app_state = Arc::new(Mutex::new(AppState::new()));

    // Tauriアプリケーションの構築と実行
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // 認証関連コマンド
            auth::login,
            auth::logout,
            auth::get_auth_status,
            // チャット関連コマンド
            chat::send_message,
            chat::get_conversation_history,
            chat::start_new_conversation,
            chat::get_all_conversations,
            chat::delete_conversation,
            // ファイル操作コマンド
            file_ops::read_file_content,
            file_ops::save_file_content,
            file_ops::add_file_context,
            // 設定関連コマンド
            settings::get_settings,
            settings::update_settings,
            settings::update_window_settings,
            settings::update_theme,
            settings::reset_settings
        ])
        .setup(|app| {
            info!("Tauriアプリケーションのセットアップが完了しました");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Tauriアプリケーションの実行中にエラーが発生しました");
}