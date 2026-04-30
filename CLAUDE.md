# CC Permission Manager

可视化配置 Claude Code 权限的桌面工具，基于 Tauri 2.0 + React 18 构建。

## 目录结构

```
src/                    # 前端 + Tauri 主项目
  src/                  # React 前端源码
    components/         # UI 组件
      ui/               # 通用基础组件（Radix UI 封装）
      global-config/    # 全局配置面板组件
      layout/           # 布局组件（Header、AboutDialog）
    stores/             # Zustand 状态管理
    lib/                # 工具函数（config-generator、constants 等）
    locales/            # i18n 翻译文件
    types/              # TypeScript 类型定义
  src-tauri/            # Rust 后端
    src/main.rs         # 应用入口，注册 Tauri 插件和命令
    src/commands.rs     # 所有 Tauri 命令（文件读写、Hook 安装、Python 检测等）
0_Design/               # 设计稿
0_Doc/                  # 项目文档
0_Reference/            # 参考项目（cc-switch）
1_Backup/               # 备份文件
2_Scripts/              # 测试脚本
assets/                 # 截图等静态资源
release/                # 发布产物
```

## 开发命令

```bash
cd src
pnpm install            # 安装依赖
pnpm dev                # 启动开发模式（Vite + Tauri）
pnpm dev:renderer       # 仅启动前端
pnpm build              # 生产构建
pnpm typecheck          # 类型检查
pnpm format             # 代码格式化
```

## 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + Radix UI + Zustand + i18next
- **后端**：Rust + Tauri 2.0（文件 I/O、配置解析、系统命令）
- **构建**：Vite + pnpm

## 工作习惯

- 前端代码在 `src/src/` 下，Rust 代码在 `src/src-tauri/src/` 下
- Tauri 命令定义在 `commands.rs`，需要在 `main.rs` 的 `invoke_handler` 中注册
- 配置文件路径：`~/.claude/permissions.json`、`~/.claude/settings.json`
- 修改前端代码会热更新，修改 Rust 代码需要重新编译

## Git 服务器

- **平台**：GitHub
- **仓库**：https://github.com/Tonyhzk/cc-permission-manager
- **分支**：main 为主分支

## 构建

### macOS

在项目根目录执行：

```bash
bash 2_Scripts/mac_build.sh
```

选 `3` 构建 Universal Binary（ARM64 + x64）。

产物输出到 `src/src-tauri/target/universal-apple-darwin/release/bundle/dmg/`。

### Windows

通过 Parallels 虚拟机（`Windows 11`）交叉编译。虚拟机内项目路径：`C:\Users\jjp\Documents\GIthub\cc-permission-manager`

**同步代码到虚拟机**：

```bash
# 项目目录在 macOS 侧的可写路径
/Volumes/[C] Windows 11/Users/jjp/Documents/GIthub/cc-permission-manager
```

只同步构建需要的内容：整个 `src/`（跳过 `node_modules`、`dist`、`src-tauri/target`），加上根目录的 `VERSION`、`2_Scripts/`、`README.md`、`CHANGELOG.md` 等。

**构建 x64 安装包**：

```bash
prlctl exec "Windows 11" cmd /c "cd C:\Users\jjp\Documents\GIthub\cc-permission-manager\src && 2_Scripts\win_build_x64.bat"
```

如果 `prlctl exec` 环境变量不对，需要手动指定（`prlctl exec` 默认不是 `jjp` 用户环境）：

```
USERPROFILE=C:\Users\jjp
CARGO_HOME=C:\Users\jjp\.cargo
RUSTUP_HOME=C:\Users\jjp\.rustup
PATH=C:\Users\jjp\.cargo\bin;C:\Users\jjp\AppData\Roaming\npm;%PATH%
```

**注意**：Tauri 依赖用 `^` 写法，Windows 端重装 `node_modules` 时小版本可能漂移，导致 Rust 侧和 JS 侧版本不匹配。如果构建报版本不对，把 `package.json` 里的 Tauri 相关依赖钉死到当前可用版本，删掉 `node_modules` 重装。

**产物路径**（虚拟机内）：

- NSIS：`src\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\`
- MSI：`src\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\`

构建完成后拷回 macOS 侧的 `release/<版本号>/`。

详细踩坑记录见 `0_Doc/0.4.4_发布与Windows虚拟机构建记录.md`。

## 当前状态

- 版本：0.5.0
- 跨平台支持 macOS + Windows
- 核心功能已可用：全局权限配置、Hook 安装/卸载、提示音设置、项目配置
