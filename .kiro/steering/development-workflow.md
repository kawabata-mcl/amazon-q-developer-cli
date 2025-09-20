---
inclusion: manual
---

# 開発ワークフロー・ベストプラクティス

## Git ワークフロー

### ブランチ戦略
- **main**: 本番リリース用の安定ブランチ
- **feature/**: 新機能開発用ブランチ
- **bugfix/**: バグ修正用ブランチ
- **hotfix/**: 緊急修正用ブランチ

### コミットメッセージ規約
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type（必須）
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: フォーマット変更（機能に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

#### 例
```
feat(cli): チャット履歴の保存機能を追加

- SQLiteデータベースを使用した履歴保存
- 履歴の検索・フィルタリング機能
- プライバシー設定による履歴の自動削除

Closes #123
```

## 開発環境セットアップ

### 初期セットアップ
```bash
# 1. リポジトリクローン
git clone https://github.com/aws/amazon-q-developer-cli.git
cd amazon-q-developer-cli

# 2. Rust環境セットアップ
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup toolchain install nightly
cargo install typos-cli

# 3. 依存関係インストール
cargo build

# 4. 開発用フック設定
npm install  # Huskyフック用
```

### 日常的な開発コマンド
```bash
# 開発実行
cargo run --bin chat_cli

# 特定のサブコマンドテスト
cargo run --bin chat_cli -- login
cargo run --bin chat_cli -- chat "Hello, Q!"

# テスト実行
cargo test                    # 全テスト
cargo test --lib             # ライブラリテストのみ
cargo test --bin chat_cli    # バイナリテストのみ

# 品質チェック
cargo clippy                 # リント
cargo +nightly fmt          # フォーマット
typos                       # タイポチェック
cargo deny check            # セキュリティ監査
```

## テスト戦略

### テストピラミッド
1. **ユニットテスト** (70%): 個別関数・メソッドのテスト
2. **統合テスト** (20%): コンポーネント間の連携テスト
3. **E2Eテスト** (10%): 実際のCLI操作テスト

### テスト実装ガイドライン

#### ユニットテスト
```rust
// src/config.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_config_load_success() {
        // Given: 一時的な設定ファイル
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config.toml");
        std::fs::write(&config_path, r#"
            api_endpoint = "https://test.example.com"
            timeout = 30
        "#).unwrap();
        
        // When: 設定読み込み
        let config = Config::load(&config_path).unwrap();
        
        // Then: 期待される値
        assert_eq!(config.api_endpoint, "https://test.example.com");
        assert_eq!(config.timeout, 30);
    }
}
```

#### 統合テスト
```rust
// tests/cli_integration.rs
use assert_cmd::Command;
use predicates::prelude::*;
use tempfile::TempDir;

#[test]
fn test_login_flow() {
    let temp_dir = TempDir::new().unwrap();
    
    let mut cmd = Command::cargo_bin("chat_cli").unwrap();
    cmd.env("Q_CONFIG_DIR", temp_dir.path())
        .arg("login")
        .arg("--device-code")
        .assert()
        .success()
        .stdout(predicate::str::contains("デバイスコード"));
}
```

#### モックとスタブ
```rust
use mockito::{mock, Matcher};

#[tokio::test]
async fn test_api_client_error_handling() {
    // Given: モックサーバーセットアップ
    let _m = mock("GET", "/api/user")
        .with_status(500)
        .with_header("content-type", "application/json")
        .with_body(r#"{"error": "Internal Server Error"}"#)
        .create();
    
    // When: APIクライアント呼び出し
    let client = ApiClient::new(&mockito::server_url());
    let result = client.get_user("test_user").await;
    
    // Then: エラーハンドリング確認
    assert!(result.is_err());
    match result.unwrap_err() {
        ApiError::ServerError { status } => assert_eq!(status, 500),
        _ => panic!("予期しないエラータイプ"),
    }
}
```

## デバッグ・トラブルシューティング

### ログ設定
```rust
use tracing::{info, warn, error, debug};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_logging() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "chat_cli=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}

// 使用例
async fn authenticate_user(credentials: &Credentials) -> Result<Token, AuthError> {
    info!("ユーザー認証を開始します");
    debug!("認証エンドポイント: {}", credentials.endpoint);
    
    match perform_auth(credentials).await {
        Ok(token) => {
            info!("認証に成功しました");
            Ok(token)
        }
        Err(e) => {
            error!("認証に失敗しました: {}", e);
            Err(e)
        }
    }
}
```

### 環境変数設定
```bash
# デバッグレベルのログ出力
export RUST_LOG=chat_cli=debug

# 詳細なトレース出力
export RUST_LOG=trace

# 特定のモジュールのみ
export RUST_LOG=chat_cli::auth=debug,chat_cli::api=info
```

### パフォーマンス分析
```rust
use std::time::Instant;

async fn performance_critical_function() -> Result<Data, Error> {
    let start = Instant::now();
    
    let result = expensive_operation().await?;
    
    let duration = start.elapsed();
    if duration.as_millis() > 1000 {
        warn!("処理時間が長すぎます: {:?}", duration);
    }
    
    Ok(result)
}
```

## リリース・デプロイメント

### バージョン管理
```toml
# Cargo.toml
[workspace.package]
version = "1.15.0"  # セマンティックバージョニング

# バージョンアップ例
# 1.15.0 -> 1.15.1 (パッチ: バグ修正)
# 1.15.0 -> 1.16.0 (マイナー: 新機能追加)
# 1.15.0 -> 2.0.0  (メジャー: 破壊的変更)
```

### リリースチェックリスト
1. **コード品質確認**
   - [ ] 全テストが通過
   - [ ] Clippyの警告がゼロ
   - [ ] フォーマットが適用済み
   - [ ] タイポチェック完了

2. **ドキュメント更新**
   - [ ] CHANGELOG.md更新
   - [ ] README.md更新（必要に応じて）
   - [ ] API ドキュメント更新

3. **セキュリティチェック**
   - [ ] 依存関係の脆弱性チェック
   - [ ] セキュリティ監査完了

4. **パフォーマンステスト**
   - [ ] ベンチマークテスト実行
   - [ ] メモリリーク確認

### 継続的インテグレーション

#### GitHub Actions設定例
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: rustfmt, clippy
      
      - name: フォーマットチェック
        run: cargo fmt --all -- --check
      
      - name: Clippyチェック
        run: cargo clippy --all-targets --all-features -- -D warnings
      
      - name: テスト実行
        run: cargo test --all-features
      
      - name: タイポチェック
        run: typos
```

## コードレビュー基準

### レビュー観点
1. **機能性**: 要件を満たしているか
2. **可読性**: コードが理解しやすいか
3. **保守性**: 将来の変更に対応しやすいか
4. **パフォーマンス**: 効率的な実装か
5. **セキュリティ**: セキュリティ上の問題はないか
6. **テスト**: 適切なテストが含まれているか

### レビューコメント例
```rust
// ✅ 良いレビューコメント
// 提案: エラーハンドリングをより具体的にできます
// match result {
//     Ok(data) => process_data(data),
//     Err(ApiError::Timeout) => retry_request(),
//     Err(e) => return Err(e),
// }

// ❌ 避けるべきコメント
// このコードは悪い
```

### プルリクエストテンプレート
```markdown
## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新

## 説明
<!-- 変更内容の詳細説明 -->

## テスト
- [ ] ユニットテスト追加
- [ ] 統合テスト追加
- [ ] 手動テスト完了

## チェックリスト
- [ ] コードフォーマット適用済み
- [ ] Clippyの警告解決済み
- [ ] ドキュメント更新済み
- [ ] 破壊的変更の場合、マイグレーションガイド作成済み
```