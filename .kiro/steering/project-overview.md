# Amazon Q Developer CLI プロジェクト概要

## プロジェクトについて

Amazon Q Developer CLIは、開発者がコマンドラインからAmazon Q Developerとやり取りできるRust製のCLIツールです。このプロジェクトはAWSが開発・保守しており、MIT/Apache 2.0のデュアルライセンスで提供されています。

### 主要な機能
- コマンドラインからのAmazon Q Developerとのチャット機能
- コード生成とレビュー支援
- 開発者向けのAI支援機能
- クロスプラットフォーム対応（macOS、Linux、Windows）

### プロジェクト構造
```
amazon-q-developer-cli/
├── crates/                          # Rustクレート群
│   ├── chat-cli/                    # メインCLIアプリケーション
│   ├── amzn-codewhisperer-client/   # CodeWhispererクライアント
│   ├── amzn-qdeveloper-streaming-client/ # Q Developer ストリーミングクライアント
│   ├── semantic-search-client/      # セマンティック検索クライアント
│   └── ...                         # その他のクライアントライブラリ
├── docs/                           # 技術ドキュメント
├── scripts/                        # ビルド・運用スクリプト
├── schemas/                        # JSONスキーマ定義
└── build-config/                   # ビルド設定
```

## 開発環境とツール

### 必要な環境
- **Rust**: stable + nightly toolchain
- **OS**: macOS (Xcode 13+), Linux, Windows
- **パッケージマネージャー**: Homebrew (macOS)

### 主要なコマンド
```bash
# 開発実行
cargo run --bin chat_cli

# テスト実行
cargo test

# リント実行
cargo clippy

# フォーマット
cargo +nightly fmt

# サブコマンド実行例
cargo run --bin chat_cli -- login
```

### 品質管理ツール
- **Clippy**: 静的解析とリント
- **rustfmt**: コードフォーマット
- **typos**: タイポチェック
- **deny.toml**: 依存関係の脆弱性チェック
- **Husky**: Git hooks管理

## アーキテクチャ

### ワークスペース構成
- **モノレポ構造**: 複数のクレートを単一リポジトリで管理
- **クライアントライブラリ**: 各AWS サービス用の専用クライアント
- **メインCLI**: chat-cliクレートがエントリーポイント

### 主要な依存関係
- **非同期処理**: tokio
- **HTTP通信**: reqwest, hyper
- **CLI**: clap
- **JSON処理**: serde_json
- **暗号化**: rustls, ring
- **データベース**: rusqlite
- **AWS SDK**: aws-config, aws-sdk-*

## 貢献ガイドライン

### 開発フロー
1. **Issue確認**: 既存のissueを確認し、重複を避ける
2. **機能提案**: 新機能は事前にissueで提案・議論
3. **フォーク**: リポジトリをフォークして作業
4. **テスト**: ローカルテストを必ず実行
5. **PR作成**: 明確なコミットメッセージでPR作成

### コード品質基準
- **テストカバレッジ**: 新機能には適切なテストを追加
- **ドキュメント**: パブリックAPIには適切なドキュメントを記述
- **エラーハンドリング**: 適切なエラー処理を実装
- **セキュリティ**: セキュリティ脆弱性の報告は専用チャネルを使用

### ライセンス
- **デュアルライセンス**: MIT OR Apache-2.0
- **貢献者**: 貢献時にライセンス確認が必要

## セキュリティ

### 脆弱性報告
- **報告先**: AWS Vulnerability Reporting Page
- **禁止事項**: パブリックなGitHub issueでのセキュリティ問題報告は禁止

### セキュリティ対策
- **依存関係管理**: deny.tomlによる脆弱性チェック
- **暗号化**: rustls使用による安全な通信
- **認証**: AWS認証システムとの統合

## リリース・デプロイ

### バージョン管理
- **現在のバージョン**: 1.15.0
- **バージョニング**: セマンティックバージョニング準拠

### 配布方法
- **macOS**: DMG形式
- **Linux**: Ubuntu/Debian、AppImage、その他ディストリビューション
- **インストール**: 公式ドキュメント参照

## 連絡先・サポート

### 開発チーム
- **メインチーム**: Amazon Q CLI Team (q-cli@amazon.com)
- **主要開発者**: 
  - Chay Nabors (nabochay@amazon.com)
  - Brandon Kiser (bskiser@amazon.com)
  - Felix Ding (dingfeli@amazon.com)

### コミュニティ
- **GitHub**: Issues、Discussions
- **行動規範**: Amazon Open Source Code of Conduct準拠