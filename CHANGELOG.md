# Changelog

All notable changes to this project will be documented in this file.

**English** | [中文](CHANGELOG_CN.md)

---

## [0.4.4] - 2026-04-27

### Added
- **Unknown Tool Permission Control** - Added `allowUnknownTool` permission switch for unrecognized tools, mirroring the existing `allowUnknownCommand` for unrecognized Bash commands. Previously unrecognized tools always defaulted to "ask" regardless of user settings.

### Changed
- **Template categories updated** - The default permissions template (`permissions.json`) now includes author's personalized category rules based on real-world usage. Users should adjust these to their own needs:
  - `read.tools`: Added `ToolSearch`
  - `read.commands`: Added `sleep *`, `for *`, `do *`, `done`
  - `risky.tools`: Added `Agent`
  - `risky.commands`: Wildcard pattern spacing adjusted (e.g. `*rm *` → `* rm *`) for clearer glob matching
  - `globalAllow.commands`: Added `python*claude*` (excludes Claude-related Python scripts from restrictions)
  - `globalDeny.tools`: Added `*perplexity_research`, `*perplexity_reason`, `EnterPlanMode`
  - `acceptEdits` mode: `editAllFiles` default changed from 0 to 1, `allowUnknownCommand` and `allowUnknownTool` changed from 0 to 1

### Fixed
- **Hook Script** - Unrecognized tools previously always returned "ask" regardless of settings; now correctly reads the `allowUnknownTool` switch
- **Template sync on install** - When `permissions.json` already exists, installation now compares it with the latest template and only fills in missing fields with template defaults, preserving all existing user settings

### Removed
- **Dead code** - Removed unused `constants.ts` file (`DEFAULT_PERMISSIONS_CONFIG` was never imported anywhere; actual defaults come from the template file)

## [0.4.3] - 2026-02-07

### Added
- **Message Box Notification** - Added option to use message box, requires user click to continue (can be enabled independently for task completion and permission request)

### Fixed
- **Glob Pattern Matching** - Fixed `match_glob` function not matching commands containing newline characters (added `re.DOTALL` flag)

## [0.4.1] - 2026-02-02

### Improvements
- **Window Resizing** - Enabled window resizing and fullscreen functionality

## [0.4.0]

### Added
- **Locate Hook Log Button** - Added quick action to locate Hook log file

### Improvements
- **Hook Log Path Optimization** - Log files now generated in script directory (`.claude/hooks/hook-debug.log`), supporting independent logs per project
- **Automatic Log Cleanup** - Log files automatically truncated when exceeding 1MB, keeping recent content

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