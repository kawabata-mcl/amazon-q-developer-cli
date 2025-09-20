#!/usr/bin/env python3
"""
Tauri project configuration verification script

This script verifies that the basic configuration of the fig_desktop crate
is set up correctly.
"""

import json
import pathlib
import sys
from typing import List, Dict, Any

def check_file_exists(file_path: pathlib.Path) -> bool:
    """Check file existence"""
    if file_path.exists():
        print(f"✅ {file_path} exists")
        return True
    else:
        print(f"❌ {file_path} does not exist")
        return False

def check_cargo_toml() -> bool:
    """Check Cargo.toml configuration"""
    cargo_toml_path = pathlib.Path("Cargo.toml")
    
    if not check_file_exists(cargo_toml_path):
        return False
    
    try:
        import toml
        with open(cargo_toml_path, 'r') as f:
            cargo_config = toml.load(f)
        
        # Check required dependencies
        dependencies = cargo_config.get('dependencies', {})
        required_deps = ['tauri', 'serde', 'tokio', 'tracing']
        
        for dep in required_deps:
            if dep in dependencies:
                print(f"✅ Dependency '{dep}' is configured")
            else:
                print(f"❌ Dependency '{dep}' is not configured")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Failed to read Cargo.toml: {e}")
        return False

def check_tauri_config() -> bool:
    """Check tauri.conf.json configuration"""
    tauri_config_path = pathlib.Path("src-tauri/tauri.conf.json")
    
    if not check_file_exists(tauri_config_path):
        return False
    
    try:
        with open(tauri_config_path, 'r') as f:
            tauri_config = json.load(f)
        
        # Check basic configuration
        required_keys = ['build', 'package', 'tauri']
        for key in required_keys:
            if key in tauri_config:
                print(f"✅ Tauri configuration '{key}' exists")
            else:
                print(f"❌ Tauri configuration '{key}' does not exist")
                return False
        
        # Check package name
        package_name = tauri_config.get('package', {}).get('productName')
        if package_name == "Amazon Q Desktop":
            print(f"✅ Package name is correctly configured: {package_name}")
        else:
            print(f"❌ Package name is incorrect: {package_name}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Failed to read tauri.conf.json: {e}")
        return False

def check_source_files() -> bool:
    """Check source file existence"""
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
    """Check workspace integration"""
    workspace_cargo_path = pathlib.Path("../../Cargo.toml")
    
    if not workspace_cargo_path.exists():
        print("❌ Workspace Cargo.toml not found")
        return False
    
    try:
        import toml
        with open(workspace_cargo_path, 'r') as f:
            workspace_config = toml.load(f)
        
        members = workspace_config.get('workspace', {}).get('members', [])
        if "crates/fig_desktop" in members:
            print("✅ fig_desktop is included in workspace members")
            return True
        else:
            print("❌ fig_desktop is not included in workspace members")
            return False
    except Exception as e:
        print(f"❌ Failed to read workspace Cargo.toml: {e}")
        return False

def main():
    """Main verification process"""
    print("🔍 Starting Amazon Q Desktop project configuration verification...\n")
    
    checks = [
        ("Cargo.toml configuration", check_cargo_toml),
        ("Tauri configuration", check_tauri_config),
        ("Source files", check_source_files),
        ("Workspace integration", check_workspace_integration),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n📋 Checking {check_name}:")
        if not check_func():
            all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 All verifications passed!")
        print("Tauri project foundation is correctly configured.")
        sys.exit(0)
    else:
        print("❌ Some verifications failed.")
        print("Please fix the above errors and run again.")
        sys.exit(1)

if __name__ == "__main__":
    main()