# Changelog

All notable changes to this project will be documented in this file.

**English** | [中文](CHANGELOG_CN.md)

---

## [0.4.1] - 2026-02-02

### Improvements
- **Window Resizing** - Enabled window resizing and fullscreen functionality

## [0.4.0]

### Added
- **Locate Hook Log Button** - Added quick action to locate Hook log file

### Improvements
- **Hook Log Path Optimization** - Log files now generated in script directory (`.claude/hooks/hook-debug.log`), supporting independent logs per project
- **Automatic Log Cleanup** - Log files automatically truncated when exceeding 20MB, keeping recent content

### Fixed
- Fixed dontAsk mode recognition issue

## [0.3.9] - 2026-02-01

### Initial Release

- **Global Permission Configuration** - Manage permissions for Plan Mode, Default Mode, and Accept Edits Mode
- **Category Management** - Configure tool and command category permissions
- **Notification Settings** - Customize notification behavior and sounds
- **Project Settings** - Per-project tool permissions control
- **Global Hook** - One-click install/uninstall global Hook
- **Multi-language Support** - English and Chinese interface
- **Theme Support** - Dark and Light theme
- **Cross-platform** - Support for Windows and macOS