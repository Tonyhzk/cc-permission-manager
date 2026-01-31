# Claude Code 权限管理器

[English](README.md) | [中文](README_CN.md)

权限配置管理工具。

**作者**: Tonyhzk
**GitHub**: https://github.com/Tonyhzk/cc-permission-manager

## 功能特性

- **全局配置**：管理不同模式下的权限（计划模式、默认模式、接受编辑模式）
- **分类管理**：配置工具和命令分类
- **通知设置**：自定义通知行为
- **项目设置**：按项目配置工具权限和 MCP 服务器
- **多语言支持**：支持英文和中文

## 技术栈

- **前端**：React 18、TypeScript、Tailwind CSS、Radix UI
- **状态管理**：Zustand
- **国际化**：i18next
- **桌面框架**：Tauri 2.0

## 环境要求

- Node.js 18+
- pnpm 8+
- Rust（用于 Tauri 开发）

## 安装

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 生产构建
pnpm build
```

## 项目结构

```
src/
├── components/
│   ├── ui/              # 可复用 UI 组件
│   ├── global-config/   # 全局配置组件
│   ├── project/         # 项目设置组件
│   └── layout/          # 布局组件
├── stores/              # Zustand 状态管理
├── types/               # TypeScript 类型定义
├── lib/                 # 工具函数和常量
├── locales/             # i18n 翻译文件
└── hooks/               # 自定义 React Hooks

src-tauri/
├── src/                 # Rust 后端代码
└── tauri.conf.json      # Tauri 配置文件
```

## 配置文件

应用程序管理以下配置文件：

- `~/.claude/permissions.json` - 全局权限设置
- `<项目>/.claude/settings.json` - 项目特定设置
- `<项目>/CLAUDE.md` - 项目指令

## 许可证

MIT