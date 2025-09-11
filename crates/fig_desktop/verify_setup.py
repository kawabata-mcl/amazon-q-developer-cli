#!/usr/bin/env python3
"""
Tauri プロジェクト設定の検証スクリプト

このスクリプトは fig_desktop クレートの基本的な設定が
正しく行われているかを確認します。
"""

import json
import pathlib
import sys
from typing import List, Dict, Any

def check_file_exists(file_path: pathlib.Path) -> bool:
    """ファイルの存在確認"""
    if file_path.exists():
        print(f"✅ {file_path} が存在します")
        return True
    else:
        print(f"❌ {file_path} が存在しません")
        return False

def check_cargo_toml() -> bool:
    """Cargo.toml の設定確認"""
    cargo_toml_path = pathlib.Path("Cargo.toml")
    
    if not check_file_exists(cargo_toml_path):
        return False
    
    try:
        import toml
        with open(cargo_toml_path, 'r') as f:
            cargo_config = toml.load(f)
        
        # 必要な依存関係の確認
        dependencies = cargo_config.get('dependencies', {})
        required_deps = ['tauri', 'serde', 'tokio', 'tracing']
        
        for dep in required_deps:
            if dep in dependencies:
                print(f"✅ 依存関係 '{dep}' が設定されています")
            else:
                print(f"❌ 依存関係 '{dep}' が設定されていません")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Cargo.toml の読み込みに失敗しました: {e}")
        return False

def check_tauri_config() -> bool:
    """tauri.conf.json の設定確認"""
    tauri_config_path = pathlib.Path("src-tauri/tauri.conf.json")
    
    if not check_file_exists(tauri_config_path):
        return False
    
    try:
        with open(tauri_config_path, 'r') as f:
            tauri_config = json.load(f)
        
        # 基本設定の確認
        required_keys = ['build', 'package', 'tauri']
        for key in required_keys:
            if key in tauri_config:
                print(f"✅ Tauri設定 '{key}' が存在します")
            else:
                print(f"❌ Tauri設定 '{key}' が存在しません")
                return False
        
        # パッケージ名の確認
        package_name = tauri_config.get('package', {}).get('productName')
        if package_name == "Amazon Q Desktop":
            print(f"✅ パッケージ名が正しく設定されています: {package_name}")
        else:
            print(f"❌ パッケージ名が正しくありません: {package_name}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ tauri.conf.json の読み込みに失敗しました: {e}")
        return False

def check_source_files() -> bool:
    """ソースファイルの存在確認"""
    required_files = [
        "src/main.rs",
        "src/lib.rs",
        "src/state.rs",
        "src/commands/mod.rs",
        "src/commands/auth.rs",
        "src/commands/chat.rs",
        "src/commands/file_ops.rs",
        "src/commands/settings.rs",
        "src/utils/mod.rs",
        "src/utils/cli_bridge.rs",
        "build.rs"
    ]
    
    all_exist = True
    for file_path in required_files:
        path = pathlib.Path(file_path)
        if not check_file_exists(path):
            all_exist = False
    
    return all_exist

def check_workspace_integration() -> bool:
    """ワークスペースとの統合確認"""
    workspace_cargo_path = pathlib.Path("../../Cargo.toml")
    
    if not workspace_cargo_path.exists():
        print("❌ ワークスペースの Cargo.toml が見つかりません")
        return False
    
    try:
        import toml
        with open(workspace_cargo_path, 'r') as f:
            workspace_config = toml.load(f)
        
        members = workspace_config.get('workspace', {}).get('members', [])
        if "crates/fig_desktop" in members:
            print("✅ ワークスペースメンバーに fig_desktop が含まれています")
            return True
        else:
            print("❌ ワークスペースメンバーに fig_desktop が含まれていません")
            return False
    except Exception as e:
        print(f"❌ ワークスペース Cargo.toml の読み込みに失敗しました: {e}")
        return False

def main():
    """メイン検証処理"""
    print("🔍 Amazon Q Desktop プロジェクト設定の検証を開始します...\n")
    
    checks = [
        ("Cargo.toml 設定", check_cargo_toml),
        ("Tauri 設定", check_tauri_config),
        ("ソースファイル", check_source_files),
        ("ワークスペース統合", check_workspace_integration),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n📋 {check_name} の確認:")
        if not check_func():
            all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 すべての検証が成功しました！")
        print("Tauri プロジェクトの基盤が正しく設定されています。")
        sys.exit(0)
    else:
        print("❌ 一部の検証が失敗しました。")
        print("上記のエラーを修正してから再度実行してください。")
        sys.exit(1)

if __name__ == "__main__":
    main()