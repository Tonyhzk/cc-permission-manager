# 应用软件信息配置位置参考文档

本文档记录了 Tauri + React 应用程序中，所有关于软件元信息的配置位置和代码结构。

---

## 1. 软件名称 (App Name, Product Name)

### 配置文件位置

| 文件路径 | 行号 | 字段名 | 示例值 |
|---------|------|--------|--------|
| `package.json` | 第2行 | `name` | `"app-name"` (npm包名，小写加连字符) |
| `src-tauri/Cargo.toml` | 第2行 | `name` | `"app-name"` (Rust包名) |
| `src-tauri/tauri.conf.json` | 第3行 | `productName` | `"App Name"` (显示名称) |
| `src-tauri/tauri.windows.conf.json` | ~第8行 | `title` | `"App Name"` (窗口标题) |

### 国际化文件位置

| 语言 | 文件路径 | 字段 |
|------|---------|------|
| 英文 | `src/i18n/locales/en.json` | `"title": "App Name"` |
| 中文 | `src/i18n/locales/zh.json` | `"title": "应用名称"` |
| 其他语言 | `src/i18n/locales/*.json` | 对应翻译 |

---

## 2. 软件描述 (Description)

### 配置文件位置

| 文件路径 | 行号 | 字段名 | 说明 |
|---------|------|--------|------|
| `package.json` | 第4行 | `description` | npm包描述 |
| `src-tauri/Cargo.toml` | 第4行 | `description` | Rust包描述 |

### 国际化文件位置

| 语言 | 文件路径 | 字段 |
|------|---------|------|
| 英文 | `src/i18n/locales/en.json` | `"description": "English description"` |
| 中文 | `src/i18n/locales/zh.json` | `"description": "中文描述"` |
| 其他语言 | `src/i18n/locales/*.json` | 对应翻译 |

### 文档位置

| 文件路径 | 说明 |
|---------|------|
| `README.md` | 主标题下方，通常第2-3行 |
| `README_ZH.md` | 中文README |
| `README_*.md` | 其他语言版本 |

---

## 3. 作者信息 (Author, Copyright)

### 配置文件位置

| 文件路径 | 行号 | 字段名 | 格式 |
|---------|------|--------|------|
| `package.json` | ~第19行 | `author` | `"Author Name"` 或 `"Author Name <email>"` |
| `src-tauri/Cargo.toml` | ~第5行 | `authors` | `["Author Name"]` (数组格式) |

### 许可证文件位置

| 文件路径 | 位置 | 内容 |
|---------|------|------|
| `LICENSE` | ~第3行 | `Copyright (c) YYYY Author Name` |

---

## 4. 版本号 (Version)

### 配置文件位置

| 文件路径 | 行号 | 字段名 | 格式 |
|---------|------|--------|------|
| `package.json` | 第3行 | `version` | `"x.y.z"` (语义化版本) |
| `src-tauri/Cargo.toml` | 第3行 | `version` | `"x.y.z"` |
| `src-tauri/tauri.conf.json` | 第4行 | `version` | `"x.y.z"` |

### UI代码位置（版本动态获取）

**组件文件**：`src/components/settings/AboutSection.tsx`

**导入语句**（约第16行）：
```tsx
import { getVersion } from "@tauri-apps/api/app";
```

**版本加载逻辑**（约第42-79行）：
```tsx
const [appVersion, tools] = await Promise.all([
  getVersion(),  // 从Tauri获取版本号
  settingsApi.getToolVersions(),
]);

if (active) {
  setVersion(appVersion);
  // ...
}
```

**版本显示**（约第220行）：
```tsx
<span className="font-medium">{`v${displayVersion}`}</span>
```

### 文档位置

| 文件路径 | 位置 | 格式 |
|---------|------|------|
| `README.md` | 顶部 | 版本徽章：`[![Version](https://img.shields.io/badge/version-x.y.z-blue.svg)]` |
| `CHANGELOG.md` | 全文 | 版本变更历史记录 |

---

## 5. 关于对话框 (About Dialog / About Section)

### 主要UI组件位置

| 组件路径 | 大小 | 主要功能 |
|---------|------|---------|
| `src/components/settings/AboutSection.tsx` | ~13 KB | 完整的About页面组件 |
| `src/components/settings/SettingsPage.tsx` | - | 设置页面容器，包含AboutSection |
| `src/App.tsx` | - | 主应用组件，引入SettingsPage |

### AboutSection.tsx 组件结构

**导入依赖**（约第1-20行）：
```tsx
import { getVersion } from "@tauri-apps/api/app";
import { useTranslation } from "react-i18next";
// ... 其他导入
```

**状态管理**（约第30-50行）：
```tsx
const [version, setVersion] = useState<string>("");
const [displayVersion, setDisplayVersion] = useState<string>("");
const [toolVersions, setToolVersions] = useState<ToolVersions | null>(null);
// ... 其他状态
```

**版本加载函数**（约第42-79行）：
```tsx
const loadVersions = async () => {
  const [appVersion, tools] = await Promise.all([
    getVersion(),
    settingsApi.getToolVersions(),
  ]);
  setVersion(appVersion);
  setToolVersions(tools);
};
```

**UI布局区域**：

1. **应用信息卡片**（约第185-230行）：
   - 应用图标（from `@/assets/icons/app-icon.png`）
   - 应用名称显示
   - 版本号显示
   - 便携版标识（可选）

2. **操作按钮区**（约第232-274行）：
   - "Release Notes" 按钮（跳转到发布页）
   - "Check for Updates" 按钮（检查更新）

3. **本地环境检查**（约第299-367行）：
   - 显示相关CLI工具的版本信息
   - 本地版本 vs 最新版本对比

4. **一键安装命令**（约第369-397行）：
   - 显示安装命令
   - 复制到剪贴板功能

### 国际化键值对

**文件位置**：`src/i18n/locales/*.json`

**About页面相关的翻译键**：
```json
{
  "settings.about": "关于",
  "settings.aboutHint": "关于页面提示文字",
  "settings.localEnvCheck": "本地环境检查",
  "settings.checkForUpdates": "检查更新",
  "settings.updating": "更新中...",
  "settings.updateAvailable": "有新版本可用",
  "settings.releaseNotes": "发布说明",
  "settings.oneClickInstall": "一键安装",
  "settings.oneClickInstallHint": "安装提示",
  "settings.installCommandsCopied": "命令已复制",
  "common.version": "版本",
  "common.refresh": "刷新"
}
```

---

## 6. 许可证信息 (License)

### 许可证文件

| 文件路径 | 说明 |
|---------|------|
| `LICENSE` | 完整的许可证文本（通常是MIT、Apache 2.0等） |

### 配置文件中的许可证字段

| 文件路径 | 行号 | 字段名 | 值 |
|---------|------|--------|-----|
| `package.json` | ~第20行 | `license` | `"MIT"` 或其他许可证标识 |
| `src-tauri/Cargo.toml` | ~第6行 | `license` | `"MIT"` 或其他许可证标识 |

### 许可证文件模板结构

**MIT License 示例**：
```
MIT License

Copyright (c) YYYY Author Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software")...
```

---

## 7. 应用图标 (Application Icon)

### 图标引用位置

**配置文件**：`src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",    // macOS
      "icons/icon.ico"       // Windows
    ]
  }
}
```

### UI中的图标引用

**About页面**：`src/components/settings/AboutSection.tsx`

```tsx
import appIcon from "@/assets/icons/app-icon.png";

// 使用
<img src={appIcon} alt="App Icon" />
```

### 图标生成命令

```bash
# 使用Tauri CLI从源文件生成所有平台图标
pnpm tauri icon <source-file.svg>

# 例如
pnpm tauri icon ../0_Design/icon.svg
```

**源文件要求**：
- 格式：PNG 或 SVG
- 形状：正方形
- 透明度：需要支持透明通道
- 推荐尺寸：512x512 或 1024x1024

---

## 8. 后端命令 (Backend Commands)

### 命令文件位置

**主文件**：`src-tauri/src/commands/misc.rs` 或类似的命令模块

### 常见命令函数

| 函数名 | 位置 | 功能 |
|--------|------|------|
| `get_tool_versions()` | ~第91-131行 | 获取相关工具的版本信息 |
| `check_for_updates()` | ~第36-48行 | 检查应用更新 |
| `open_external()` | ~第21-34行 | 打开外部链接（浏览器） |

### 命令注册位置

**文件**：`src-tauri/src/main.rs`

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::misc::get_tool_versions,
            commands::misc::check_for_updates,
            commands::misc::open_external,
            // ... 其他命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## 9. 文档文件清单

### 必需文档

| 文件名 | 用途 |
|--------|------|
| `README.md` | 主README（英文） |
| `LICENSE` | 许可证文件 |
| `CHANGELOG.md` | 版本变更历史 |

### 可选文档

| 文件名 | 用途 |
|--------|------|
| `README_ZH.md` | 中文README |
| `README_*.md` | 其他语言版本 |
| `CONTRIBUTING.md` | 贡献指南 |
| `CODE_OF_CONDUCT.md` | 行为准则 |
| `docs/` | 详细文档目录 |

### README 语言切换示例

**在README顶部添加**：
```markdown
# App Name

[English](README.md) | [中文](README_ZH.md) | [日本語](README_JA.md)

Short description here...
```

---

## 10. 完整配置文件清单

### 核心配置文件

| 文件路径 | 用途 |
|---------|------|
| `package.json` | Node.js/npm 项目配置 |
| `src-tauri/Cargo.toml` | Rust/Tauri 包配置 |
| `src-tauri/tauri.conf.json` | Tauri 应用主配置 |
| `src-tauri/tauri.windows.conf.json` | Windows 平台特定配置 |
| `src-tauri/tauri.linux.conf.json` | Linux 平台特定配置（可选） |
| `src-tauri/tauri.macos.conf.json` | macOS 平台特定配置（可选） |

### 国际化配置

| 文件路径 | 用途 |
|---------|------|
| `src/i18n/locales/en.json` | 英文翻译 |
| `src/i18n/locales/zh.json` | 中文翻译 |
| `src/i18n/locales/*.json` | 其他语言翻译 |

---

## 11. 修改软件信息的完整流程

### 步骤 1：修改基本信息

1. **软件名称**：
   - 修改 `package.json` 的 `name` 字段
   - 修改 `src-tauri/Cargo.toml` 的 `name` 字段
   - 修改 `src-tauri/tauri.conf.json` 的 `productName` 字段
   - 修改所有 `src/i18n/locales/*.json` 的 `title` 字段

2. **软件描述**：
   - 修改 `package.json` 的 `description` 字段
   - 修改 `src-tauri/Cargo.toml` 的 `description` 字段
   - 修改所有 `src/i18n/locales/*.json` 的 `description` 字段
   - 更新 `README.md` 及其他语言版本

3. **作者信息**：
   - 修改 `package.json` 的 `author` 字段
   - 修改 `src-tauri/Cargo.toml` 的 `authors` 字段
   - 修改 `LICENSE` 文件的版权声明

4. **版本号**：
   - 同时修改 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 的 `version` 字段
   - 更新 `CHANGELOG.md`
   - 更新 `README.md` 中的版本徽章

### 步骤 2：修改应用图标

```bash
# 1. 准备源图标文件（512x512 或更大的正方形 SVG/PNG）
# 2. 运行图标生成命令
cd src
pnpm tauri icon ../path/to/source-icon.svg

# 3. 确认生成的图标位于 src-tauri/icons/ 目录
```

### 步骤 3：更新 UI 组件

- 如果About页面有硬编码的软件名称，需要修改 `src/components/settings/AboutSection.tsx`
- 建议使用 i18n 翻译键而不是硬编码文本

### 步骤 4：测试和验证

```bash
# 开发模式测试
pnpm dev

# 检查以下内容：
# - 窗口标题是否正确
# - About页面显示的名称和版本
# - 应用图标是否正确显示
```

### 步骤 5：构建和发布

```bash
# 构建生产版本
pnpm build

# 检查生成的安装包信息
# - 安装包名称
# - 应用图标
# - 版本号
```

---

## 12. 注意事项

### 版本号管理

- 所有配置文件中的版本号必须保持一致
- 遵循语义化版本规范（Semantic Versioning）：`MAJOR.MINOR.PATCH`
- 每次发布前更新 `CHANGELOG.md`

### 国际化

- 所有面向用户的文本都应该使用 i18n 翻译
- 避免在代码中硬编码软件名称或描述
- 为每种支持的语言提供完整的翻译文件

### 许可证

- 确保 `LICENSE` 文件与 `package.json` 和 `Cargo.toml` 中的许可证类型一致
- 更新版权年份和作者信息

### 图标

- 使用矢量格式（SVG）作为源文件，便于后续调整
- 确保图标在小尺寸下仍然清晰可辨
- 测试在不同平台（Windows、macOS、Linux）上的显示效果

---

## 13. 快速检查清单

修改软件信息时，请确保更新以下所有位置：

- [ ] `package.json` - name, version, description, author, license
- [ ] `src-tauri/Cargo.toml` - name, version, description, authors, license
- [ ] `src-tauri/tauri.conf.json` - productName, version, identifier
- [ ] `src/i18n/locales/en.json` - title, description
- [ ] `src/i18n/locales/zh.json` - title, description
- [ ] `README.md` - title, description, badges
- [ ] `README_ZH.md` - title, description
- [ ] `LICENSE` - copyright year and author
- [ ] `CHANGELOG.md` - version history
- [ ] `src-tauri/icons/` - application icons (generated)
- [ ] `src/components/settings/AboutSection.tsx` - 检查硬编码文本

---

## 14. 参考资源

- [Tauri 配置文档](https://tauri.app/v1/api/config/)
- [语义化版本](https://semver.org/)
- [MIT License 模板](https://opensource.org/licenses/MIT)
- [i18next 文档](https://www.i18next.com/)
- [package.json 字段说明](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- [Cargo.toml 清单格式](https://doc.rust-lang.org/cargo/reference/manifest.html)