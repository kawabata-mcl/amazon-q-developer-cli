# Amazon Q Desktop アーキテクチャ

## 概要

Amazon Q Desktop は、既存の Amazon Q Developer CLI 機能を macOS ネイティブアプリケーションとして提供する Tauri ベースのアプリケーションです。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                    macOS Application                        │
├─────────────────────────────────────────────────────────────┤
│                    Tauri Framework                          │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   Web Frontend      │    │      Rust Backend          │ │
│  │   (Next.js/React)   │◄──►│   (Tauri Commands)         │ │
│  │                     │    │                             │ │
│  │ - Chat UI           │    │ - auth.rs                   │ │
│  │ - Settings Panel    │    │ - chat.rs                   │ │
│  │ - File Drop Zone    │    │ - file_ops.rs               │ │
│  │ - Message History   │    │ - settings.rs               │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 CLI Bridge Layer                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              utils/cli_bridge.rs                        │ │
│  │                                                         │ │
│  │ - execute_login()                                       │ │
│  │ - send_chat_message()                                   │ │
│  │ - check_auth_status()                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              Existing CLI Components                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  chat-cli crate                         │ │
│  │                                                         │ │
│  │ - Authentication                                        │ │
│  │ - API Clients                                           │ │
│  │ - Database                                              │ │
│  │ - Telemetry                                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                External Services                            │
│                                                             │
│ - Amazon Q Developer API                                    │
│ - AWS Services                                              │
│ - MCP Servers                                               │
└─────────────────────────────────────────────────────────────┘
```

## コンポーネント詳細

### 1. Tauri Commands (src/commands/)

#### auth.rs
- `login()`: AWS SSO ログイン処理
- `logout()`: ログアウト処理
- `get_auth_status()`: 認証状態の取得

#### chat.rs
- `send_message()`: メッセージ送信
- `get_conversation_history()`: 会話履歴取得
- `start_new_conversation()`: 新規会話開始
- `get_all_conversations()`: 全会話リスト取得
- `delete_conversation()`: 会話削除

#### file_ops.rs
- `read_file_content()`: ファイル内容読み込み
- `save_file_content()`: ファイル内容保存
- `add_file_context()`: ファイルコンテキスト追加

#### settings.rs
- `get_settings()`: 設定取得
- `update_settings()`: 設定更新
- `update_window_settings()`: ウィンドウ設定更新
- `update_theme()`: テーマ設定更新
- `reset_settings()`: 設定リセット

### 2. State Management (src/state.rs)

#### AppState
アプリケーション全体の状態を管理する中央ストア：
- 認証状態
- 現在の会話ID
- 会話履歴
- アプリケーション設定

#### データ構造
- `GuiConversationState`: GUI用会話状態
- `GuiMessage`: GUI用メッセージ
- `AppSettings`: アプリケーション設定

### 3. CLI Bridge (src/utils/cli_bridge.rs)

既存の CLI 機能と GUI を橋渡しするレイヤー：
- CLI コマンドの実行
- レスポンスの変換
- エラーハンドリング

### 4. Frontend (ui/ - 未実装)

Next.js + React + TypeScript による Web フロントエンド：
- チャットインターフェース
- 設定画面
- ファイルドラッグ&ドロップ
- 会話履歴管理

## データフロー

1. **ユーザー操作**: フロントエンドでユーザーがアクション実行
2. **Tauri Command**: JavaScript から Rust の Tauri コマンドを呼び出し
3. **CLI Bridge**: Tauri コマンドが CLI Bridge を通じて既存機能を実行
4. **CLI Execution**: 既存の chat-cli 機能が実際の処理を実行
5. **Response**: 結果がレイヤーを逆順で返される
6. **UI Update**: フロントエンドが結果を受け取り UI を更新

## セキュリティ考慮事項

- ファイルシステムアクセスの制限
- 機密情報のメモリクリア
- HTTPS 通信の強制
- 入力値の検証

## パフォーマンス最適化

- 仮想スクロール（大量メッセージ対応）
- 遅延読み込み
- メモリ効率的な状態管理
- 非同期処理の最適化

## 今後の拡張予定

- Windows/Linux サポート
- プラグインシステム
- カスタムテーマ
- 高度な設定オプション