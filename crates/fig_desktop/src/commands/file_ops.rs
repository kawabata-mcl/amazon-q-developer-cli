/// ファイル操作関連のTauriコマンド

use std::path::Path;
use tauri::State;
use tracing::{info, error};

use super::{GuiError, FileContent};

/// ファイル内容読み込みコマンド
#[tauri::command]
pub async fn read_file_content(
    file_path: String,
) -> Result<FileContent, String> {
    info!("ファイル読み込みを開始します: {}", file_path);
    
    let path = Path::new(&file_path);
    
    // ファイルの存在確認
    if !path.exists() {
        let error_msg = format!("ファイルが存在しません: {}", file_path);
        error!("{}", error_msg);
        return Err(error_msg);
    }
    
    // ファイルサイズの確認（大きすぎるファイルを避ける）
    match std::fs::metadata(&path) {
        Ok(metadata) => {
            let file_size = metadata.len();
            
            // 10MB以上のファイルは読み込みを拒否
            if file_size > 10 * 1024 * 1024 {
                let error_msg = format!("ファイルサイズが大きすぎます: {} bytes", file_size);
                error!("{}", error_msg);
                return Err(error_msg);
            }
            
            // ファイル内容の読み込み
            match tokio::fs::read_to_string(&path).await {
                Ok(content) => {
                    // MIME タイプの推定
                    let mime_type = guess_mime_type(&file_path);
                    
                    let file_content = FileContent {
                        path: file_path.clone(),
                        content,
                        size: file_size,
                        mime_type,
                    };
                    
                    info!("ファイル読み込みが成功しました: {} ({} bytes)", file_path, file_size);
                    Ok(file_content)
                }
                Err(e) => {
                    let error_msg = format!("ファイル読み込みに失敗しました: {}", e);
                    error!("{}", error_msg);
                    Err(error_msg)
                }
            }
        }
        Err(e) => {
            let error_msg = format!("ファイル情報の取得に失敗しました: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// ファイル内容保存コマンド
#[tauri::command]
pub async fn save_file_content(
    file_path: String,
    content: String,
) -> Result<(), String> {
    info!("ファイル保存を開始します: {}", file_path);
    
    let path = Path::new(&file_path);
    
    // ディレクトリが存在しない場合は作成
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            match tokio::fs::create_dir_all(parent).await {
                Ok(_) => {
                    info!("ディレクトリを作成しました: {:?}", parent);
                }
                Err(e) => {
                    let error_msg = format!("ディレクトリ作成に失敗しました: {}", e);
                    error!("{}", error_msg);
                    return Err(error_msg);
                }
            }
        }
    }
    
    // ファイル内容の保存
    match tokio::fs::write(&path, content.as_bytes()).await {
        Ok(_) => {
            info!("ファイル保存が成功しました: {}", file_path);
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("ファイル保存に失敗しました: {}", e);
            error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// ファイルコンテキスト追加コマンド（ドラッグ&ドロップ用）
#[tauri::command]
pub async fn add_file_context(
    file_name: String,
    content: String,
) -> Result<(), String> {
    info!("ファイルコンテキストを追加します: {}", file_name);
    
    // TODO: 実際のCLI bridgeを使用してファイルコンテキストを追加
    // 現在はログ出力のみ
    info!("ファイルコンテキストが追加されました: {} ({} 文字)", file_name, content.len());
    
    Ok(())
}

/// MIME タイプの推定
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