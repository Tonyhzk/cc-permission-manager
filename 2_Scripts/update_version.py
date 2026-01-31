#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Version Update Script for CC Permission Manager
Updates version numbers across all configuration files
"""

import os
import re
import json
import sys

# Get script directory and project root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
SRC_DIR = os.path.join(PROJECT_ROOT, "src")

# File paths
TAURI_CONF = os.path.join(SRC_DIR, "src-tauri", "tauri.conf.json")
CARGO_TOML = os.path.join(SRC_DIR, "src-tauri", "Cargo.toml")
PACKAGE_JSON = os.path.join(SRC_DIR, "package.json")


def validate_version(version):
    """Validate version format (e.g., 0.3.0, 1.0.0, 1.2.3-beta)"""
    pattern = r'^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$'
    return re.match(pattern, version) is not None


def get_current_versions():
    """Get current version numbers from all files"""
    versions = {}

    # Read tauri.conf.json
    try:
        with open(TAURI_CONF, 'r', encoding='utf-8') as f:
            tauri_conf = json.load(f)
            versions['tauri.conf.json'] = tauri_conf.get('version', 'N/A')
    except Exception as e:
        versions['tauri.conf.json'] = f'Error: {e}'

    # Read Cargo.toml
    try:
        with open(CARGO_TOML, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
            versions['Cargo.toml'] = match.group(1) if match else 'N/A'
    except Exception as e:
        versions['Cargo.toml'] = f'Error: {e}'

    # Read package.json
    try:
        with open(PACKAGE_JSON, 'r', encoding='utf-8') as f:
            package_json = json.load(f)
            versions['package.json'] = package_json.get('version', 'N/A')
    except Exception as e:
        versions['package.json'] = f'Error: {e}'

    return versions


def update_tauri_conf(new_version):
    """Update version in tauri.conf.json"""
    try:
        with open(TAURI_CONF, 'r', encoding='utf-8') as f:
            data = json.load(f)

        old_version = data.get('version', 'N/A')
        data['version'] = new_version

        with open(TAURI_CONF, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add newline at end

        return True, old_version
    except Exception as e:
        return False, str(e)


def update_cargo_toml(new_version):
    """Update version in Cargo.toml"""
    try:
        with open(CARGO_TOML, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find old version
        match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
        old_version = match.group(1) if match else 'N/A'

        # Replace version
        new_content = re.sub(
            r'^version\s*=\s*"[^"]+"',
            f'version = "{new_version}"',
            content,
            count=1,
            flags=re.MULTILINE
        )

        with open(CARGO_TOML, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True, old_version
    except Exception as e:
        return False, str(e)


def update_package_json(new_version):
    """Update version in package.json"""
    try:
        with open(PACKAGE_JSON, 'r', encoding='utf-8') as f:
            data = json.load(f)

        old_version = data.get('version', 'N/A')
        data['version'] = new_version

        with open(PACKAGE_JSON, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add newline at end

        return True, old_version
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 60)
    print("  CC Permission Manager - Version Update Script")
    print("=" * 60)
    print()

    # Show current versions
    print("Current versions:")
    print("-" * 60)
    current_versions = get_current_versions()
    for file, version in current_versions.items():
        print(f"  {file:20s} : {version}")
    print()

    # Check if versions are consistent
    version_values = [v for v in current_versions.values() if not v.startswith('Error')]
    if len(set(version_values)) > 1:
        print("⚠️  WARNING: Version numbers are inconsistent!")
        print()

    # Get new version from user
    while True:
        new_version = input("Enter new version number (e.g., 0.4.0): ").strip()

        if not new_version:
            print("❌ Version number cannot be empty!")
            continue

        if not validate_version(new_version):
            print("❌ Invalid version format! Use format: X.Y.Z (e.g., 0.4.0, 1.0.0)")
            continue

        break

    print()
    print(f"New version will be: {new_version}")
    print()

    # Confirm
    confirm = input("Proceed with update? (y/n): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("❌ Update cancelled.")
        sys.exit(0)

    print()
    print("Updating files...")
    print("-" * 60)

    # Update files
    results = []

    # Update tauri.conf.json
    success, info = update_tauri_conf(new_version)
    if success:
        print(f"✅ tauri.conf.json: {info} → {new_version}")
        results.append(True)
    else:
        print(f"❌ tauri.conf.json: Failed - {info}")
        results.append(False)

    # Update Cargo.toml
    success, info = update_cargo_toml(new_version)
    if success:
        print(f"✅ Cargo.toml: {info} → {new_version}")
        results.append(True)
    else:
        print(f"❌ Cargo.toml: Failed - {info}")
        results.append(False)

    # Update package.json
    success, info = update_package_json(new_version)
    if success:
        print(f"✅ package.json: {info} → {new_version}")
        results.append(True)
    else:
        print(f"❌ package.json: Failed - {info}")
        results.append(False)

    print()
    print("=" * 60)

    if all(results):
        print("✅ All files updated successfully!")
        print()
        print("Next steps:")
        print("  1. Commit the changes: git add . && git commit -m 'Bump version to " + new_version + "'")
        print("  2. Create a tag: git tag v" + new_version)
        print("  3. Rebuild the application")
    else:
        print("⚠️  Some files failed to update. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Update cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)