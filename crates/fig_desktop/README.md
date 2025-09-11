# Amazon Q Desktop

Amazon Q Developer CLIのmacOS向けGUIアプリケーション

## 概要

このクレートは、既存のAmazon Q Developer CLI機能をTauriフレームワークを使用してmacOSネイティブアプリケーションとして提供します。

## 機能

- **認証**: AWS SSOを使用したログイン/ログアウト
- **チャット**: Amazon Q Developerとのリアルタイムチャット
- **ファイル操作**: ドラッグ&ドロップによるファイルコンテキスト追加
- **設定管理**: アプリケーション設定の管理
- **会話履歴**: チャット履歴の保存と管理

## アーキテクチャ

- **フロントエンド**: Next.js + React + TypeScript
- **バックエンド**: Rust + Tauri
- **CLI統合**: 既存のchat-cliクレートとの統合

## 開発

### 前提条件

- Rust 1.79.0以上
- Node.js 22以上
- Tauri CLI

### ビルド

```bash
# 開発モード
cargo tauri dev

# リリースビルド
cargo tauri build
```

### プロジェクト構造

```
crates/fig_desktop/
├── src/                     # Rust backend
│   ├── main.rs              # エントリーポイント
│   ├── state.rs             # アプリケーション状態管理
│   ├── commands/            # Tauri commands
│   └── utils/               # ユーティリティ
├── src-tauri/               # Tauri設定
│   └── tauri.conf.json      # Tauri設定ファイル
└── ui/                      # Next.js frontend (TODO)
```

## TODO

- [ ] Next.jsフロントエンドの実装
- [ ] 実際のCLI機能との統合
- [ ] アプリケーションアイコンの追加
- [ ] DMGパッケージング
- [ ] コード署名と公証