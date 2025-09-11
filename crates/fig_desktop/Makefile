# Amazon Q Desktop 開発用 Makefile

.PHONY: help setup dev build test lint fmt clean install-deps check-env

# デフォルトターゲット
help:
	@echo "Amazon Q Desktop 開発用コマンド:"
	@echo ""
	@echo "セットアップ:"
	@echo "  setup          - 開発環境の自動セットアップ"
	@echo "  install-deps   - 依存関係のインストール"
	@echo "  check-env      - 環境の検証"
	@echo ""
	@echo "開発:"
	@echo "  dev            - 開発サーバーの起動"
	@echo "  build          - デバッグビルド"
	@echo "  build-release  - リリースビルド"
	@echo ""
	@echo "テスト・品質:"
	@echo "  test           - テストの実行"
	@echo "  lint           - リントの実行"
	@echo "  fmt            - コードフォーマット"
	@echo "  check          - 全体チェック（テスト+リント+フォーマット）"
	@echo ""
	@echo "その他:"
	@echo "  clean          - ビルド成果物のクリーンアップ"

# 開発環境のセットアップ
setup:
	@echo "🚀 開発環境をセットアップしています..."
	@chmod +x scripts/setup-dev.sh
	@./scripts/setup-dev.sh

# 依存関係のインストール
install-deps:
	@echo "📦 依存関係をインストールしています..."
	@cargo build -p fig_desktop

# 環境の検証
check-env:
	@echo "🔍 環境を検証しています..."
	@python3 verify_setup.py

# 開発サーバーの起動
dev:
	@echo "🔥 開発サーバーを起動しています..."
	@cargo tauri dev

# デバッグビルド
build:
	@echo "🔨 デバッグビルドを実行しています..."
	@cargo build -p fig_desktop

# リリースビルド
build-release:
	@echo "🚀 リリースビルドを実行しています..."
	@cargo build -p fig_desktop --release

# Tauriアプリケーションのビルド
build-app:
	@echo "📱 Tauriアプリケーションをビルドしています..."
	@cargo tauri build

# テストの実行
test:
	@echo "🧪 テストを実行しています..."
	@cargo test -p fig_desktop

# リントの実行
lint:
	@echo "🔍 リントを実行しています..."
	@cargo clippy -p fig_desktop -- -D warnings

# フォーマットの実行
fmt:
	@echo "✨ コードをフォーマットしています..."
	@cargo +nightly fmt

# フォーマットチェック
fmt-check:
	@echo "📝 フォーマットをチェックしています..."
	@cargo +nightly fmt --check

# 全体チェック
check: test lint fmt-check
	@echo "✅ 全体チェックが完了しました"

# ビルド成果物のクリーンアップ
clean:
	@echo "🧹 ビルド成果物をクリーンアップしています..."
	@cargo clean
	@rm -rf src-tauri/target

# 開発用ウォッチモード
watch:
	@echo "👀 ファイル変更を監視しています..."
	@cargo watch -x "build -p fig_desktop"

# ログ付きで開発サーバーを起動
dev-verbose:
	@echo "🔥 詳細ログ付きで開発サーバーを起動しています..."
	@RUST_LOG=debug cargo tauri dev

# 依存関係の更新
update-deps:
	@echo "📦 依存関係を更新しています..."
	@cargo update

# セキュリティ監査
audit:
	@echo "🔒 セキュリティ監査を実行しています..."
	@cargo audit

# ベンチマークの実行
bench:
	@echo "⚡ ベンチマークを実行しています..."
	@cargo bench -p fig_desktop

# ドキュメントの生成
docs:
	@echo "📚 ドキュメントを生成しています..."
	@cargo doc -p fig_desktop --open

# 開発環境のリセット
reset:
	@echo "🔄 開発環境をリセットしています..."
	@cargo clean
	@rm -rf ../../.venv
	@rm -f .env

# CI/CD用のチェック
ci-check: fmt-check lint test
	@echo "🤖 CI/CDチェックが完了しました"