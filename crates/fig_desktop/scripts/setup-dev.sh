#!/bin/bash
# Amazon Q Desktop 開発環境自動セットアップスクリプト

set -e

echo "🚀 Amazon Q Desktop 開発環境のセットアップを開始します..."

# カラー出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 前提条件のチェック
check_prerequisites() {
    log_info "前提条件をチェックしています..."
    
    # macOSかどうかチェック
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "このスクリプトはmacOS専用です"
        exit 1
    fi
    
    # Homebrewのチェック
    if ! command -v brew &> /dev/null; then
        log_warning "Homebrewがインストールされていません。インストールしますか？ (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        else
            log_error "Homebrewが必要です"
            exit 1
        fi
    fi
    
    log_success "前提条件のチェック完了"
}

# Xcode Command Line Tools のインストール
install_xcode_tools() {
    log_info "Xcode Command Line Tools をチェックしています..."
    
    if ! xcode-select -p &> /dev/null; then
        log_info "Xcode Command Line Tools をインストールしています..."
        xcode-select --install
        log_warning "Xcode Command Line Tools のインストールが完了したら、このスクリプトを再実行してください"
        exit 0
    fi
    
    log_success "Xcode Command Line Tools は既にインストールされています"
}

# Rust環境のセットアップ
setup_rust() {
    log_info "Rust環境をセットアップしています..."
    
    # Rustupのインストール
    if ! command -v rustup &> /dev/null; then
        log_info "Rustup をインストールしています..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    
    # 必要なツールチェーンのインストール
    log_info "Rust 1.87.0 をインストールしています..."
    rustup install 1.87.0
    rustup default 1.87.0
    
    # コンポーネントの追加
    rustup component add rustfmt clippy
    
    # ターゲットの追加
    rustup target add x86_64-apple-darwin
    rustup target add aarch64-apple-darwin
    
    log_success "Rust環境のセットアップ完了"
}

# Tauri CLI のインストール
install_tauri_cli() {
    log_info "Tauri CLI をインストールしています..."
    
    if ! command -v cargo-tauri &> /dev/null; then
        cargo install tauri-cli@1.6.0 --locked
    else
        log_info "Tauri CLI は既にインストールされています"
    fi
    
    log_success "Tauri CLI のインストール完了"
}

# Node.js環境のセットアップ
setup_nodejs() {
    log_info "Node.js環境をセットアップしています..."
    
    # Node.js 22のインストール
    if ! command -v node &> /dev/null || [[ $(node --version) != v22* ]]; then
        log_info "Node.js 22 をインストールしています..."
        brew install node@22
        brew link node@22 --force
    fi
    
    # バージョン確認
    NODE_VERSION=$(node --version)
    log_success "Node.js ${NODE_VERSION} がインストールされています"
}

# Python環境のセットアップ
setup_python() {
    log_info "Python環境をセットアップしています..."
    
    # Python 3.11のインストール
    if ! command -v python3.11 &> /dev/null; then
        log_info "Python 3.11 をインストールしています..."
        brew install python@3.11
    fi
    
    # 仮想環境の作成
    if [[ ! -d "../../.venv" ]]; then
        log_info "Python仮想環境を作成しています..."
        cd ../..
        python3.11 -m venv .venv
        cd crates/fig_desktop
    fi
    
    log_success "Python環境のセットアップ完了"
}

# 依存関係のインストール
install_dependencies() {
    log_info "プロジェクト依存関係をインストールしています..."
    
    # Python仮想環境のアクティベート
    cd ../..
    source .venv/bin/activate
    
    # Python依存関係のインストール
    if [[ -f "build-scripts/requirements.txt" ]]; then
        pip install -r build-scripts/requirements.txt
    fi
    
    # Rust依存関係のビルド
    log_info "Rust依存関係をビルドしています（初回は時間がかかります）..."
    cargo build -p fig_desktop
    
    cd crates/fig_desktop
    log_success "依存関係のインストール完了"
}

# 開発用ツールのインストール
install_dev_tools() {
    log_info "開発用ツールをインストールしています..."
    
    # cargo-watch のインストール
    if ! command -v cargo-watch &> /dev/null; then
        cargo install cargo-watch
    fi
    
    log_success "開発用ツールのインストール完了"
}

# 環境変数の設定
setup_environment() {
    log_info "環境変数を設定しています..."
    
    # .envファイルの作成
    cat > .env << EOF
# Amazon Q Desktop 開発環境設定
RUST_LOG=debug
TAURI_DEBUG=true
DISABLE_SIGNING=true
EOF
    
    log_success "環境変数の設定完了"
}

# 検証の実行
run_verification() {
    log_info "セットアップの検証を実行しています..."
    
    if [[ -f "verify_setup.py" ]]; then
        cd ../..
        source .venv/bin/activate
        cd crates/fig_desktop
        python3 verify_setup.py
    else
        log_warning "検証スクリプトが見つかりません"
    fi
}

# 使用方法の表示
show_usage() {
    echo ""
    log_success "🎉 セットアップが完了しました！"
    echo ""
    echo "次のコマンドで開発を開始できます："
    echo ""
    echo "  # 開発サーバーの起動"
    echo "  cargo tauri dev"
    echo ""
    echo "  # テストの実行"
    echo "  cargo test -p fig_desktop"
    echo ""
    echo "  # リントの実行"
    echo "  cargo clippy -p fig_desktop"
    echo ""
    echo "  # フォーマットの実行"
    echo "  cargo fmt"
    echo ""
    echo "詳細な開発ガイドは DEVELOPMENT_SETUP.md を参照してください。"
}

# メイン実行
main() {
    check_prerequisites
    install_xcode_tools
    setup_rust
    install_tauri_cli
    setup_nodejs
    setup_python
    install_dependencies
    install_dev_tools
    setup_environment
    run_verification
    show_usage
}

# スクリプトの実行
main "$@"