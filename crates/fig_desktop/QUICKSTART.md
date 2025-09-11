# Amazon Q Desktop クイックスタート

## 🚀 最速セットアップ（5分）

### 1. 自動セットアップスクリプトの実行

```bash
cd crates/fig_desktop
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

このスクリプトが以下を自動で行います：
- Rust 1.87.0 のインストール
- Tauri CLI のインストール
- Node.js 22 のインストール
- Python 3.11 のインストール
- 仮想環境の作成
- 依存関係のインストール

### 2. 開発サーバーの起動

```bash
# Makefileを使用（推奨）
make dev

# または直接実行
cargo tauri dev
```

## 🛠️ 手動セットアップ

自動スクリプトが使えない場合の手動セットアップ：

### 前提条件
```bash
# Homebrew のインストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Xcode Command Line Tools
xcode-select --install
```

### Rust環境
```bash
# Rustup のインストール
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 必要なバージョンとコンポーネント
rustup install 1.87.0
rustup default 1.87.0
rustup component add rustfmt clippy
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Tauri CLI
cargo install tauri-cli@1.6.0 --locked
```

### Node.js環境
```bash
# Node.js 22
brew install node@22
brew link node@22
```

### Python環境
```bash
# Python 3.11
brew install python@3.11

# 仮想環境（プロジェクトルートで実行）
cd ../..
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
cd crates/fig_desktop
```

### 依存関係のビルド
```bash
cargo build -p fig_desktop
```

## 📋 よく使うコマンド

### Makefileコマンド（推奨）
```bash
make help          # 利用可能なコマンド一覧
make dev           # 開発サーバー起動
make test          # テスト実行
make lint          # リント実行
make fmt           # フォーマット実行
make check         # 全体チェック
make build         # デバッグビルド
make build-release # リリースビルド
make clean         # クリーンアップ
```

### 直接実行
```bash
# 開発
cargo tauri dev

# テスト
cargo test -p fig_desktop

# リント
cargo clippy -p fig_desktop

# フォーマット
cargo fmt

# ビルド
cargo build -p fig_desktop
cargo build -p fig_desktop --release
```

## 🔍 環境の検証

```bash
# 検証スクリプトの実行
python3 verify_setup.py

# または
make check-env
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. `cargo tauri` コマンドが見つからない
```bash
# パスの確認
echo $PATH
source ~/.cargo/env

# 再インストール
cargo install tauri-cli@1.6.0 --locked --force
```

#### 2. Node.js のバージョンが古い
```bash
# バージョン確認
node --version

# Node.js 22 に更新
brew unlink node
brew install node@22
brew link node@22
```

#### 3. Python 仮想環境の問題
```bash
# 仮想環境の再作成
rm -rf ../../.venv
cd ../..
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
cd crates/fig_desktop
```

#### 4. Rust コンパイルエラー
```bash
# 依存関係の更新
cargo update

# クリーンビルド
cargo clean
cargo build -p fig_desktop
```

## 📁 プロジェクト構造

```
crates/fig_desktop/
├── src/                    # Rustソースコード
├── src-tauri/             # Tauri設定
├── ui/                    # フロントエンド（次のタスクで実装）
├── scripts/               # 開発スクリプト
├── Makefile              # 開発用コマンド
├── DEVELOPMENT_SETUP.md  # 詳細セットアップガイド
└── QUICKSTART.md         # このファイル
```

## 🎯 次のステップ

1. **開発サーバーの起動**: `make dev`
2. **コードの変更**: `src/` 以下のファイルを編集
3. **テストの実行**: `make test`
4. **フロントエンドの実装**: 次のタスクで `ui/` ディレクトリを作成

## 📚 参考資料

- [Tauri公式ドキュメント](https://tauri.app/v1/guides/)
- [Rust公式ドキュメント](https://doc.rust-lang.org/book/)
- [プロジェクトアーキテクチャ](./ARCHITECTURE.md)
- [詳細セットアップガイド](./DEVELOPMENT_SETUP.md)

---

問題が発生した場合は、`DEVELOPMENT_SETUP.md` の詳細なトラブルシューティングセクションを参照してください。