# Implementation Plan

- [x] 1. プロジェクト構造と Tauri 基盤の構築

  - fig_desktop クレートの作成と Cargo.toml の設定
  - Tauri プロジェクトの初期化と tauri.conf.json の設定
  - 既存の chat-cli クレートとの依存関係の設定
  - _Requirements: 1.1, 3.1_

- [x] 2. Next.js フロントエンドの基盤構築

  - [x] 2.1 Next.js プロジェクトの初期化と設定

    - Next.js の初期セットアップを実施しているので、ディレクトリを確認し、作業内容を決定する
    - package.json の作成と依存関係の設定
    - next.config.mjs で静的エクスポート設定（output: 'export'）
    - TypeScript、Tailwind CSS、ESLint の設定
    - _Requirements: 1.1, 7.1_

  - [x] 2.2 基本的な App Router ページ構造の作成
    - app/layout.tsx でルートレイアウトの実装
    - app/page.tsx でホームページの実装
    - app/chat/page.tsx でチャットページの実装
    - app/settings/page.tsx で設定ページの実装
    - _Requirements: 1.1, 4.2_

- [x] 3. Rust バックエンドの Tauri コマンド実装

  - [x] 3.1 認証関連コマンドの実装

    - login、logout、get_auth_status コマンドの作成
    - 既存の auth module との統合
    - 認証状態の管理とエラーハンドリング
    - _Requirements: 2.1, 4.1_

  - [x] 3.2 チャット関連コマンドの実装

    - send_message、get_conversation_history、start_new_conversation コマンドの作成
    - 既存の chat-cli 機能との統合
    - ストリーミングレスポンスの実装
    - _Requirements: 1.2, 2.2, 5.1_

  - [x] 3.3 ファイル操作コマンドの実装
    - read_file_content、save_file_content コマンドの作成
    - セキュアなファイルアクセスの実装
    - ファイルドラッグ&ドロップサポート
    - _Requirements: 2.3, 6.2_

- [x] 4. 基本 UI コンポーネントの実装

  - [x] 4.1 共通 UI コンポーネントの作成

    - Button、Input、Card、Spinner コンポーネントの実装
    - Tailwind CSS を使用したスタイリング
    - TypeScript での型安全性の確保
    - _Requirements: 7.1, 8.1_

  - [x] 4.2 レイアウトコンポーネントの実装
    - Header、Sidebar、StatusBar コンポーネントの作成
    - レスポンシブデザインの実装
    - ナビゲーション機能の実装
    - _Requirements: 7.1, 7.2_

- [x] 5. 認証機能の実装

  - [x] 5.1 AuthPanel コンポーネントの実装

    - ログイン/ログアウト UI の作成
    - Tauri コマンドとの連携
    - 認証状態の表示とエラーハンドリング
    - _Requirements: 2.1, 4.1_

  - [x] 5.2 認証状態管理の実装
    - Zustand ストアでの認証状態管理
    - useAuth カスタムフックの作成
    - 認証が必要なページでの保護機能
    - _Requirements: 2.1, 4.1_

- [x] 6. チャット機能の実装

  - [x] 6.1 基本的なチャット UI の実装

    - ChatWindow コンポーネントの作成
    - MessageList と MessageItem コンポーネントの実装
    - MessageInput コンポーネントの実装
    - _Requirements: 1.2, 5.1, 6.1_

  - [x] 6.2 メッセージ送受信機能の実装

    - Tauri コマンドを使用したメッセージ送信
    - リアルタイムメッセージ表示の実装
    - エラーハンドリングとローディング状態の管理
    - _Requirements: 1.2, 5.1, 5.2_

  - [x] 6.3 会話履歴管理の実装
    - 会話履歴の保存と読み込み
    - 複数会話の管理機能
    - 会話の検索とフィルタリング
    - _Requirements: 4.2, 5.1_

- [x] 7. ファイルドラッグ&ドロップ機能の実装

  - [x] 7.1 FileDropZone コンポーネントの実装

    - ドラッグ&ドロップイベントの処理
    - ファイル読み込みと Tauri コマンドへの送信
    - 視覚的フィードバックの実装
    - _Requirements: 2.3, 6.2_

  - [x] 7.2 ファイルコンテキスト管理の実装
    - アップロードされたファイルの管理
    - ファイル内容の表示と編集
    - ファイル削除機能の実装
    - _Requirements: 2.3, 6.2_

- [x] 8. 設定機能の実装

  - [x] 8.1 SettingsPanel コンポーネントの実装

    - 設定項目の UI 作成（タブ形式）
    - 設定値の保存と読み込み
    - 設定変更の即座反映
    - _Requirements: 4.2, 7.1_

  - [x] 8.2 アプリケーション設定の管理
    - ウィンドウサイズと位置の保存
    - テーマ設定（ダークモード/ライトモード）
    - キーボードショートカットの設定
    - _Requirements: 4.2, 7.2, 7.3_

- [x] 9. 構文ハイライトとマークダウン対応

  - [x] 9.1 コード構文ハイライトの実装

    - 複数プログラミング言語のサポート
    - コードブロックの識別と表示
    - コピー機能の実装
    - _Requirements: 6.1, 6.2_

  - [ｘ] 9.2 マークダウンレンダリングの実装
    - メッセージ内のマークダウン解析
    - 安全な HTML レンダリング
    - リンクとメディアの処理
    - _Requirements: 6.1, 6.2_

- [x] 10. パフォーマンス最適化

  - [x] 10.1 仮想スクロールの実装

    - 大量メッセージの効率的な表示
    - メモリ使用量の最適化
    - スムーズなスクロール体験
    - _Requirements: 8.1, 8.3_

  - [x] 10.2 状態管理の最適化
    - 不要な再レンダリングの防止
    - メモ化の適切な使用
    - 非同期処理の最適化
    - _Requirements: 8.1, 8.3_

- [x] 11. エラーハンドリングと通知システム

  - [x] 11.1 エラーハンドリングの実装

    - グローバルエラーハンドラーの作成
    - ユーザーフレンドリーなエラーメッセージ
    - エラーログの記録
    - _Requirements: 1.3, 8.1_

  - [x] 11.2 通知システムの実装
    - NotificationToast コンポーネントの作成
    - 成功/エラー/情報通知の表示
    - 通知の自動消去機能
    - _Requirements: 1.3, 8.1_

- [x] 12. テスト実装

  - [x] 12.1 ユニットテストの作成

    - React コンポーネントのテスト
    - カスタムフックのテスト
    - Zustand ストアのテスト
    - _Requirements: 全要件_

  - [x] 12.2 統合テストの作成
    - Tauri コマンドとの統合テスト
    - ファイル操作のテスト
    - 認証フローのテスト
    - _Requirements: 全要件_

- [x] 13. macOS ネイティブ機能の統合

  - [x] 13.1 macOS システム統合の実装

    - システムテーマの自動検出
    - ネイティブメニューバーの実装
    - Finder との連携機能
    - _Requirements: 7.2, 7.3_

  - [x] 13.2 キーボードショートカットの実装
    - macOS 標準ショートカットのサポート
    - カスタムショートカットの設定
    - アクセシビリティ対応
    - _Requirements: 7.2, 7.3_

- [ ] 14. ビルドとパッケージング

  - [ ] 14.1 ビルドプロセスの統合

    - 既存の build-macos.sh スクリプトとの統合
    - Tauri ビルドコマンドの追加
    - 依存関係の管理
    - _Requirements: 3.1, 3.2_

  - [ ] 14.2 DMG パッケージの作成
    - macOS 用インストーラーの作成
    - アプリケーション署名の実装
    - 公証プロセスの統合
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 15. 最終統合とテスト

  - [ ] 15.1 E2E テストの実装

    - Playwright を使用した E2E テスト
    - 主要ユーザーフローのテスト
    - パフォーマンステストの実装
    - _Requirements: 全要件_

  - [ ] 15.2 最終的な統合とポリッシュ
    - 全機能の統合テスト
    - UI の最終調整とポリッシュ
    - ドキュメントの作成
    - _Requirements: 全要件_
