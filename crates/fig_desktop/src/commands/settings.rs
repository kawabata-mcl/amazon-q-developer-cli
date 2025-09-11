/// 設定関連のTauriコマンド

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use tracing::{info, error};

use crate::state::{AppState, AppSettings};
use super::GuiError;

/// 設定取得コマンド
#[tauri::command]
pub async fn get_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AppSettings, String> {
    let app_state = state.lock().await;
    info!("設定を取得しました");
    Ok(app_state.settings.clone())
}

/// 設定更新コマンド
#[tauri::command]
pub async fn update_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
    settings: AppSettings,
) -> Result<(), String> {
    info!("設定を更新します");
    
    // 設定の妥当性チェック
    if let Err(validation_error) = validate_settings(&settings) {
        let error_msg = format!("設定が無効です: {}", validation_error);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // 設定を更新
    {
        let mut app_state = state.lock().await;
        app_state.settings = settings;
    }
    
    // TODO: 設定をファイルに永続化
    // 現在はメモリ内のみの更新
    
    info!("設定の更新が完了しました");
    Ok(())
}

/// ウィンドウ設定更新コマンド
#[tauri::command]
pub async fn update_window_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
    width: u32,
    height: u32,
    x: Option<i32>,
    y: Option<i32>,
    maximized: bool,
) -> Result<(), String> {
    info!("ウィンドウ設定を更新します: {}x{}", width, height);
    
    {
        let mut app_state = state.lock().await;
        app_state.settings.window_settings.width = width;
        app_state.settings.window_settings.height = height;
        app_state.settings.window_settings.x = x;
        app_state.settings.window_settings.y = y;
        app_state.settings.window_settings.maximized = maximized;
    }
    
    info!("ウィンドウ設定の更新が完了しました");
    Ok(())
}

/// テーマ設定更新コマンド
#[tauri::command]
pub async fn update_theme(
    state: State<'_, Arc<Mutex<AppState>>>,
    theme: crate::state::Theme,
) -> Result<(), String> {
    info!("テーマ設定を更新します: {:?}", theme);
    
    {
        let mut app_state = state.lock().await;
        app_state.settings.appearance.theme = theme;
    }
    
    info!("テーマ設定の更新が完了しました");
    Ok(())
}

/// 設定リセットコマンド
#[tauri::command]
pub async fn reset_settings(
    state: State<'_, Arc<Mutex<AppState>>>,
) -> Result<AppSettings, String> {
    info!("設定をリセットします");
    
    let default_settings = AppSettings::default();
    
    {
        let mut app_state = state.lock().await;
        app_state.settings = default_settings.clone();
    }
    
    info!("設定のリセットが完了しました");
    Ok(default_settings)
}

/// 設定の妥当性チェック
fn validate_settings(settings: &AppSettings) -> Result<(), String> {
    // ウィンドウサイズの妥当性チェック
    if settings.window_settings.width < 400 {
        return Err("ウィンドウ幅は400px以上である必要があります".to_string());
    }
    
    if settings.window_settings.height < 300 {
        return Err("ウィンドウ高さは300px以上である必要があります".to_string());
    }
    
    // フォントサイズの妥当性チェック
    if settings.appearance.font_size < 8 || settings.appearance.font_size > 72 {
        return Err("フォントサイズは8px〜72pxの範囲で設定してください".to_string());
    }
    
    // 履歴数の妥当性チェック
    if settings.chat_settings.max_history_count > 1000 {
        return Err("最大履歴数は1000件以下で設定してください".to_string());
    }
    
    Ok(())
}