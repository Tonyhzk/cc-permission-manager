# Claude Code Permission Manager

A desktop application for managing Claude Code permissions and settings.

## Features

- **Global Configuration**: Manage permissions for different modes (Plan, Default, Accept Edits)
- **Category Management**: Configure tool and command categories
- **Notification Settings**: Customize notification behavior
- **Project Settings**: Per-project tool permissions and MCP server configuration
- **Multi-language Support**: English and Chinese

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Internationalization**: i18next
- **Desktop Framework**: Tauri 2.0

## Prerequisites

- Node.js 18+
- pnpm 8+
- Rust (for Tauri development)

## Installation

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── global-config/   # Global configuration components
│   ├── project/         # Project settings components
│   └── layout/          # Layout components
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions and constants
├── locales/             # i18n translation files
└── hooks/               # Custom React hooks

src-tauri/
├── src/                 # Rust backend code
└── tauri.conf.json      # Tauri configuration
```

## Configuration Files

The app manages:

- `~/.claude/permissions.json` - Global permission settings
- `<project>/.claude/settings.json` - Project-specific settings
- `<project>/CLAUDE.md` - Project instructions

## License

MIT
