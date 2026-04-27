# 更新日志

本项目的所有重要更改都将记录在此文件中。

[English](CHANGELOG.md) | **中文**

---

## [0.4.4] - 2026-04-27

### 新增
- **未知工具权限控制** - 新增 `allowUnknownTool` 权限开关，用于控制未识别工具的权限行为，与已有的未知命令开关 `allowUnknownCommand` 对应。此前未识别的工具无论设置如何都固定返回"询问"。

### 变更
- **模板分类规则更新** - 默认权限模板（`permissions.json`）现包含作者根据实际使用经验调整的个人化分类规则，用户可按需自行修改：
  - `read.tools`：新增 `ToolSearch`
  - `read.commands`：新增 `sleep *`、`for *`、`do *`、`done`
  - `risky.tools`：新增 `Agent`
  - `risky.commands`：通配符模式格式调整（如 `*rm *` → `* rm *`），使 Glob 匹配更清晰
  - `globalAllow.commands`：新增 `python*claude*`（将 Claude 相关 Python 脚本排除在限制之外）
  - `globalDeny.tools`：新增 `*perplexity_research`、`*perplexity_reason`、`EnterPlanMode`
  - `acceptEdits` 模式：`editAllFiles` 默认值从 0 改为 1，`allowUnknownCommand` 和 `allowUnknownTool` 从 0 改为 1

### 修复
- **Hook 脚本** - 未识别工具此前无论设置如何都固定返回"询问"，现已正确读取 `allowUnknownTool` 开关
- **安装时模板补全** - 当 `permissions.json` 已存在时，安装流程现在会对比最新模板，只补齐缺失字段并写入模板默认值，用户已有配置保持不变

### 移除
- **死代码清理** - 移除未使用的 `constants.ts` 文件（`DEFAULT_PERMISSIONS_CONFIG` 从未被任何模块引用，实际默认值由模板文件提供）

## [0.4.3] - 2026-02-07

### 新增
- **弹窗通知** - 新增弹窗通知选项，需点击确认后才继续（任务完成和权限请求可分别独立开启）

### 修复
- **Glob 模式匹配** - 修复 `match_glob` 函数无法匹配包含换行符的命令（添加 `re.DOTALL` 标志）

## [0.4.1] - 2026-02-02

### 改进
- **窗口调整** - 启用窗口大小调整和全屏功能

## [0.4.0]

### 新增
- **定位 Hook 日志按钮** - 快捷操作中新增定位 Hook 日志文件功能

### 改进
- **Hook 日志路径优化** - 日志文件现在生成在脚本所在目录（`.claude/hooks/hook-debug.log`），支持多项目独立日志
- **日志自动清理** - 日志文件超过 1MB 时自动截断，保留最近内容

### 修复
- 修复 dontAsk 模式识别问题

## [0.3.9] - 2026-02-01

### 首次发布

- **全局权限配置** - 管理计划模式、默认模式和接受编辑模式的权限
- **分类管理** - 配置工具和命令分类权限
- **通知设置** - 自定义通知行为和声音
- **项目设置** - 项目级别的工具权限控制
- **全局 Hook** - 一键安装/卸载全局 Hook
- **多语言支持** - 英文和中文界面
- **主题支持** - 深色和浅色主题
- **跨平台** - 支持 Windows 和 macOS