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

- [x] 14. ビルドとパッケージング

  - [x] 14.1 ビルドプロセスの統合

    - 既存の build-macos.sh スクリプトとの統合
    - Tauri ビルドコマンドの追加
    - 依存関係の管理
    - _Requirements: 3.1, 3.2_

  - [x] 14.2 DMG パッケージの作成
    - macOS 用インストーラーの作成
    - アプリケーション署名の実装
    - 公証プロセスの統合
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 15. 最終統合とテスト

  - [x] 15.1 E2E テストの実装

    - Playwright を使用した E2E テスト
    - 主要ユーザーフローのテスト
    - パフォーマンステストの実装
    - _Requirements: 全要件_

  - [x] 15.2 最終的な統合とポリッシュ
    - 全機能の統合テスト
    - UI の最終調整とポリッシュ
    - ドキュメントの作成
    - _Requirements: 全要件_

- [x] 16. ネットワークエラーハンドリングの修正

  - [x] 16.1 送信ボタンのローディング状態管理の修正

    - use-chat.ts フックでのタイムアウト制御実装（AbortController使用）
    - message-input.tsx でのローディング状態リセット機能追加
    - エラー発生時の送信ボタン状態復旧機能実装
    - 再送信ボタンの UI コンポーネント作成
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 16.2 タイムアウトエラーハンドリングの強化
    - TimeoutError 型定義の追加（types/common.ts）
    - エラーハンドリング用のカスタムフック作成（use-error-handler.ts）
    - 通知システムとの統合（notification-store.ts）
    - ネットワークエラー時のユーザーフレンドリーメッセージ表示
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 17. 認証機能の実装

  - [ ] 17.1 Rust バックエンドの認証コマンド実装

    - commands/auth.rs での login、logout、get_auth_status コマンド実装
    - 既存 chat-cli の認証機能との統合
    - 認証状態の永続化（SQLite データベース使用）
    - 認証トークンの安全な管理とリフレッシュ機能
    - _Requirements: 10.1, 10.3_

  - [ ] 17.2 フロントエンド認証 UI の実装
    - auth-store.ts での認証状態管理実装
    - auth-panel.tsx でのログイン/ログアウト UI 作成
    - auth-guard.tsx での認証保護コンポーネント実装
    - 認証エラー時のエラーハンドリングと通知表示
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 18. チャット履歴機能の実装

  - [ ] 18.1 バックエンドの履歴管理機能実装

    - commands/chat.rs での save_message_auto、get_all_conversations コマンド追加
    - SQLite データベースでの会話履歴テーブル設計と実装
    - 会話メタデータ（タイトル、作成日時、メッセージ数）の管理
    - 会話履歴の効率的な検索とページネーション機能
    - _Requirements: 11.1, 14.1, 14.2_

  - [ ] 18.2 フロントエンドの履歴表示機能実装
    - conversation-list.tsx での会話一覧表示コンポーネント作成
    - conversation-stats.tsx での会話統計表示機能
    - chat-store.ts での履歴管理状態の実装
    - 会話選択時の履歴復元機能とメッセージ表示
    - _Requirements: 11.2, 11.3_

- [ ] 19. 多言語対応機能の実装

  - [ ] 19.1 国際化システムの構築

    - next-intl ライブラリの package.json への追加とセットアップ
    - locales/ ディレクトリでの翻訳ファイル作成（en.json、ja.json）
    - middleware.ts での言語検出とルーティング設定
    - use-i18n.ts カスタムフックでの翻訳機能実装
    - _Requirements: 12.1, 12.3_

  - [ ] 19.2 言語設定の永続化と UI 実装
    - commands/settings.rs での言語設定保存コマンド実装
    - language-settings.tsx での言語選択 UI コンポーネント作成
    - システム言語の自動検出機能（navigator.language 使用）
    - 言語変更時の即座反映機能とアプリケーション再描画
    - _Requirements: 12.2_

- [ ] 20. 設定画面のバグ修正

  - [ ] 20.1 テーマ設定エラーの修正

    - use-theme.ts での安全なテーマ処理実装（型ガード追加）
    - use-macos-integration.ts の isDarkTheme 関数修正（オブジェクト型チェック）
    - appearance-settings.tsx でのテーマ設定エラーハンドリング強化
    - ThemeSettings 型定義の厳密化と検証機能追加
    - _Requirements: 13.1, 13.2_

  - [ ] 20.2 エラーログ機能の修正
    - commands/error_logging.rs での ErrorLogEntry 構造体修正
    - error-handler.ts でのエラーログ送信時の型安全性確保
    - tauri-env.ts での safeInvoke 関数のエラーハンドリング改善
    - エラーログの構造化と必須フィールドの適切な設定
    - _Requirements: 13.3_

- [ ] 21. 自動保存設定の削除と改善

  - [ ] 21.1 自動保存設定 UI の削除

    - general-settings.tsx から自動保存関連の設定項目削除
    - settings-store.ts での自動保存設定の除去
    - AutoSaveSettings 型定義の簡素化（enabled フラグ削除）
    - 設定画面の UI レイアウト調整とクリーンアップ
    - _Requirements: 14.3_

  - [ ] 21.2 自動保存機能の最適化
    - use-chat.ts での送信時・受信時の即座保存実装
    - chat-store.ts の saveMessageAuto 関数の最適化
    - バッチ保存機能による DB アクセス効率化
    - 保存エラー時のリトライ機能とエラー通知実装
    - _Requirements: 14.1, 14.2_
