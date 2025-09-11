# Amazon Q Desktop 開発環境セットアップ

## 前提条件

### macOS システム要件
- macOS 10.15 (Catalina) 以上
- Xcode Command Line Tools
- 8GB以上のRAM推奨

## 1. 基本ツールのインストール

### Homebrew のインストール
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Xcode Command Line Tools のインストール
```bash
xcode-select --install
```

## 2. Rust 開発環境のセットアップ

### Rustup のインストール
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 必要なRustツールチェーンのインストール
```bash
# プロジェクトで指定されたバージョンをインストール
rustup install 1.87.0
rustup default 1.87.0

# 必要なコンポーネントを追加
rustup component add rustfmt clippy

# macOS用のターゲットを追加
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

### Tauri CLI のインストール
```bash
# 特定のバージョンをインストール（プロジェクトで使用）
cargo install tauri-cli@1.6.0 --locked
```

## 3. Node.js 開発環境のセットアップ

### Node.js のインストール（mise使用）
```bash
# mise のインストール
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc

# プロジェクトで指定されたNode.jsバージョンをインストール
mise install node@22
mise use node@22
```

### または、直接Node.jsをインストール
```bash
# Homebrewを使用
brew install node@22
brew link node@22

# バージョン確認
node --version  # v22.x.x が表示されることを確認
npm --version
```

## 4. Python 開発環境のセットアップ（ビルドスクリプト用）

### Python のインストール
```bash
# mise を使用
mise install python@3.11
mise use python@3.11

# または Homebrew を使用
brew install python@3.11
```

### 仮想環境の作成とアクティベート
```bash
# プロジェクトルートで実行
python3.11 -m venv .venv
source .venv/bin/activate

# 必要なPythonパッケージをインストール
pip install -r build-scripts/requirements.txt
```

## 5. プロジェクトのクローンとセットアップ

### リポジトリのクローン
```bash
git clone <repository-url>
cd amazon-q-developer-cli
```

### 依存関係のインストール
```bash
# Rust依存関係のビルド（初回は時間がかかります）
cargo build

# fig_desktop クレート専用のビルド
cargo build -p fig_desktop
```

## 6. 開発用の追加ツール

### 推奨エディタ拡張
VS Code を使用する場合：
- rust-analyzer
- Tauri
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

### デバッグツール
```bash
# Rust用デバッガー
cargo install cargo-watch

# ログ表示用
cargo install bunyan
```

## 7. 開発サーバーの起動

### Tauri 開発モードの起動
```bash
cd crates/fig_desktop

# 開発モードでアプリケーションを起動
cargo tauri dev
```

### フロントエンド開発サーバー（Next.js実装後）
```bash
cd crates/fig_desktop/ui

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 8. ビルドとテスト

### 開発ビルド
```bash
# Rustバックエンドのビルド
cargo build -p fig_desktop

# リリースビルド
cargo build -p fig_desktop --release

# Tauriアプリケーションのビルド
cd crates/fig_desktop
cargo tauri build
```

### テストの実行
```bash
# Rustテストの実行
cargo test -p fig_desktop

# 全体テストの実行
cargo test --workspace
```

### リントとフォーマット
```bash
# Clippy（リント）の実行
cargo clippy -p fig_desktop

# フォーマットの実行
cargo fmt

# または nightly フォーマット
cargo +nightly fmt
```

## 9. トラブルシューティング

### よくある問題と解決方法

#### 1. Tauri CLI が見つからない
```bash
# パスの確認
echo $PATH
source ~/.cargo/env

# 再インストール
cargo install tauri-cli@1.6.0 --locked --force
```

#### 2. macOS でのコード署名エラー
```bash
# 開発用証明書の作成（開発時のみ）
# Xcode > Preferences > Accounts でApple IDを追加
```

#### 3. Node.js バージョンの問題
```bash
# Node.jsバージョンの確認
node --version

# 正しいバージョンに切り替え
mise use node@22
```

#### 4. Python 仮想環境の問題
```bash
# 仮想環境の再作成
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r build-scripts/requirements.txt
```

## 10. 開発ワークフロー

### 日常的な開発フロー
```bash
# 1. 仮想環境のアクティベート
source .venv/bin/activate

# 2. 最新コードの取得
git pull origin main

# 3. 依存関係の更新
cargo update

# 4. 開発サーバーの起動
cd crates/fig_desktop
cargo tauri dev

# 5. コード変更後のテスト
cargo test -p fig_desktop
cargo clippy -p fig_desktop
```

### リリース前のチェック
```bash
# 1. 全テストの実行
cargo test --workspace

# 2. リントチェック
cargo clippy --workspace -- -D warnings

# 3. フォーマットチェック
cargo +nightly fmt --check

# 4. リリースビルド
cargo tauri build
```

## 11. 環境変数の設定

### 開発用環境変数
```bash
# ~/.bashrc または ~/.zshrc に追加
export RUST_LOG=debug
export TAURI_DEBUG=true

# 開発時のみ署名を無効化
export DISABLE_SIGNING=true
```

## 12. IDE設定

### VS Code 設定例 (.vscode/settings.json)
```json
{
  "rust-analyzer.cargo.features": ["dev"],
  "rust-analyzer.checkOnSave.command": "clippy",
  "editor.formatOnSave": true,
  "files.associations": {
    "*.rs": "rust"
  }
}
```

## 13. 検証スクリプトの実行

セットアップが完了したら、検証スクリプトを実行して環境を確認：

```bash
cd crates/fig_desktop
python3 verify_setup.py
```

## サポート

問題が発生した場合は、以下を確認してください：

1. [Tauri公式ドキュメント](https://tauri.app/v1/guides/getting-started/prerequisites)
2. [Rust公式ドキュメント](https://doc.rust-lang.org/book/)
3. プロジェクトの `TROUBLESHOOTING.md`（作成予定）

---

このセットアップガイドに従って環境を構築することで、Amazon Q Desktop アプリケーションの開発を開始できます。