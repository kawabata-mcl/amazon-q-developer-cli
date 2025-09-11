# コーディング規約・開発標準

## Rust コーディング標準

### エディション・ツールチェーン
- **Rustエディション**: 2024
- **必須ツールチェーン**: stable + nightly
- **フォーマッター**: `cargo +nightly fmt` (nightlyを使用)
- **リンター**: `cargo clippy`

### コード品質基準

#### Clippy設定
プロジェクトでは厳格なClippy設定を採用しています：

**警告レベルのルール**:
- `await_holding_lock`: ロック保持中のawait警告
- `dbg_macro`: デバッグマクロの使用警告
- `todo`, `unimplemented`: 未実装マーカーの警告
- `string_add`, `string_add_assign`: 文字列結合の非効率な使用警告
- `large_types_passed_by_value`: 大きな型の値渡し警告
- `mutex_integer`: 整数型のMutex使用警告

#### 命名規則
```rust
// ✅ 良い例
struct UserConfig {
    api_endpoint: String,
    timeout_seconds: u64,
}

impl UserConfig {
    pub fn new(endpoint: String) -> Self {
        // 実装...
    }
    
    pub fn validate_config(&self) -> Result<(), ConfigError> {
        // バリデーション実装...
    }
}

// ❌ 避けるべき例
struct userconfig {  // PascalCaseを使用すべき
    apiEndpoint: String,  // snake_caseを使用すべき
}
```

### エラーハンドリング

#### エラー型の定義
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CliError {
    #[error("設定ファイルの読み込みに失敗しました: {0}")]
    ConfigRead(#[from] std::io::Error),
    
    #[error("APIリクエストが失敗しました: {status}")]
    ApiRequest { status: u16 },
    
    #[error("認証エラー: {message}")]
    Authentication { message: String },
}
```

#### Result型の使用
```rust
// ✅ 適切なエラーハンドリング
pub async fn fetch_user_data(user_id: &str) -> Result<UserData, CliError> {
    let response = api_client
        .get_user(user_id)
        .await
        .map_err(|e| CliError::ApiRequest { 
            status: e.status().unwrap_or(500) 
        })?;
    
    Ok(response.into())
}

// ❌ 避けるべき - panicの使用
pub fn parse_config(content: &str) -> Config {
    serde_json::from_str(content).unwrap()  // panicの可能性
}
```

### 非同期プログラミング

#### Tokio使用ガイドライン
```rust
// ✅ 適切な非同期関数の実装
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = load_config().await?;
    let client = create_client(&config).await?;
    
    // 並行処理の例
    let (result1, result2) = tokio::join!(
        fetch_data(&client, "endpoint1"),
        fetch_data(&client, "endpoint2")
    );
    
    Ok(())
}

// 適切なエラーハンドリングを含む非同期関数
async fn fetch_data(client: &Client, endpoint: &str) -> Result<Data, CliError> {
    let response = client
        .get(endpoint)
        .timeout(Duration::from_secs(30))  // タイムアウト設定
        .await?;
    
    response.json().await.map_err(Into::into)
}
```

### テスト標準

#### ユニットテスト
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio_test;
    
    #[tokio::test]
    async fn test_user_config_validation() {
        // Given: テスト用の設定
        let config = UserConfig {
            api_endpoint: "https://api.example.com".to_string(),
            timeout_seconds: 30,
        };
        
        // When: バリデーション実行
        let result = config.validate_config();
        
        // Then: 期待される結果
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_error_message_format() {
        let error = CliError::Authentication {
            message: "無効なトークン".to_string(),
        };
        
        assert_eq!(
            error.to_string(),
            "認証エラー: 無効なトークン"
        );
    }
}
```

#### 統合テスト
```rust
// tests/integration_test.rs
use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn test_cli_help_command() {
    let mut cmd = Command::cargo_bin("chat_cli").unwrap();
    
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Amazon Q CLI"));
}
```

### 依存関係管理

#### Cargo.toml ベストプラクティス
```toml
[dependencies]
# バージョン指定は具体的に
serde = { version = "1.0.219", features = ["derive"] }
tokio = { version = "1.45.0", features = ["full"] }

# ワークスペース依存関係の使用
amzn-codewhisperer-client.workspace = true

# 条件付き依存関係
[target.'cfg(unix)'.dependencies]
nix.workspace = true
```

### ドキュメント標準

#### コードドキュメント
```rust
/// ユーザー設定を管理するための構造体
/// 
/// この構造体はAPI接続設定とタイムアウト設定を保持します。
/// 
/// # Examples
/// 
/// ```
/// use chat_cli::UserConfig;
/// 
/// let config = UserConfig::new("https://api.example.com".to_string());
/// assert!(config.validate_config().is_ok());
/// ```
pub struct UserConfig {
    /// APIエンドポイントのURL
    pub api_endpoint: String,
    /// リクエストタイムアウト（秒）
    pub timeout_seconds: u64,
}

impl UserConfig {
    /// 新しいUserConfigインスタンスを作成します
    /// 
    /// # Arguments
    /// 
    /// * `endpoint` - APIエンドポイントのURL
    /// 
    /// # Returns
    /// 
    /// デフォルト設定で初期化されたUserConfigインスタンス
    pub fn new(endpoint: String) -> Self {
        Self {
            api_endpoint: endpoint,
            timeout_seconds: 30,
        }
    }
}
```

### セキュリティ標準

#### 機密情報の取り扱い
```rust
// ✅ 適切な機密情報の処理
use zeroize::Zeroize;

#[derive(Zeroize)]
struct Credentials {
    #[zeroize(skip)]
    username: String,
    password: String,  // メモリから自動的にクリア
}

impl Drop for Credentials {
    fn drop(&mut self) {
        self.zeroize();
    }
}

// ❌ 避けるべき - ログに機密情報を出力
fn authenticate(password: &str) {
    println!("パスワード: {}", password);  // 機密情報をログ出力
}
```

#### 入力検証
```rust
use regex::Regex;

pub fn validate_email(email: &str) -> Result<(), ValidationError> {
    let email_regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
        .expect("正規表現のコンパイルに失敗");
    
    if email_regex.is_match(email) {
        Ok(())
    } else {
        Err(ValidationError::InvalidEmail)
    }
}
```

### パフォーマンス標準

#### メモリ効率
```rust
// ✅ 効率的な文字列処理
fn process_large_text(text: &str) -> String {
    let mut result = String::with_capacity(text.len() * 2);
    // 処理...
    result
}

// ✅ イテレータの活用
fn filter_valid_items(items: &[Item]) -> Vec<&Item> {
    items
        .iter()
        .filter(|item| item.is_valid())
        .collect()
}
```

### CI/CD 標準

#### 必須チェック項目
1. **フォーマット**: `cargo +nightly fmt --check`
2. **リント**: `cargo clippy -- -D warnings`
3. **テスト**: `cargo test`
4. **タイポチェック**: `typos`
5. **セキュリティ監査**: `cargo deny check`

#### プリコミットフック
```bash
#!/bin/sh
# .husky/pre-commit

cargo +nightly fmt --check
cargo clippy -- -D warnings
cargo test
typos
```