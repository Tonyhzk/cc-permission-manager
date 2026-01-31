# Python 自动检测和环境变量设置功能

## 功能概述

为了解决用户可能没有安装 Python 或未将 Python 添加到 PATH 的问题，新增了智能 Python 检测和自动配置功能。

---

## 核心功能

### 1. **自动检测 Python 命令**
- 优先检测 `python` 命令
- 如果不可用，检测 `python3` 命令
- 返回可用的命令名称

### 2. **Windows 智能路径搜索**
当 Python 不在 PATH 中时，自动搜索以下常见安装目录：
- `C:\Python*\`
- `C:\Program Files\Python*\`
- `C:\Program Files (x86)\Python*\`
- `%LOCALAPPDATA%\Programs\Python\Python*\`
- `%APPDATA%\Python\Python*\`

### 3. **自动设置环境变量（Windows）**
- 找到 Python 安装后，询问用户是否添加到 PATH
- 自动将 Python 目录添加到用户级环境变量
- 无需管理员权限
- 提示用户重启应用以使更改生效

### 4. **跨平台下载引导**
如果完全找不到 Python：
- **Windows**: 打开 Python Windows 下载页面，提示勾选 "Add Python to PATH"
- **macOS**: 打开 Python macOS 下载页面，推荐使用 Homebrew 安装
- **Linux**: 提供包管理器安装命令（apt/dnf/pacman）

---

## 技术实现

### 后端 (Rust)

#### 1. `check_python_command()` - Python 检测
```rust
pub struct PythonCheckResult {
    pub command: String,           // "python" or "python3" or "none"
    pub found_in_path: bool,       // Whether found in PATH
    pub installation_paths: Vec<String>, // Possible installation paths found
}
```

**功能**:
- 尝试执行 `python --version` 和 `python3 --version`
- Windows 上搜索常见安装目录
- 返回检测结果和找到的路径

#### 2. `add_to_user_path()` - 环境变量设置
```rust
pub fn add_to_user_path(directory: String) -> Result<String, String>
```

**功能**:
- 使用 PowerShell 将目录添加到用户 PATH
- 检查是否已存在以避免重复
- 仅限 Windows 平台

**PowerShell 脚本**:
```powershell
$path = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($path -notlike '*<directory>*') {
    [Environment]::SetEnvironmentVariable('Path', "$path;<directory>", 'User')
}
```

### 前端 (TypeScript)

#### 1. `python-detector.ts` - 检测和设置辅助模块

**主要函数**:

##### `detectAndSetupPython()`
```typescript
export async function detectAndSetupPython(): Promise<string>
```
- 检测 Python 命令
- 如果找到，直接返回命令名
- 如果未找到，根据平台进行处理

##### `handleWindowsPythonSetup()`
```typescript
async function handleWindowsPythonSetup(installationPaths: string[]): Promise<string>
```
- 显示找到的 Python 路径
- 询问用户是否添加到 PATH
- 调用 Rust 命令设置环境变量
- 提示重启应用

##### `promptPythonInstallation()`
```typescript
async function promptPythonInstallation(platformName: string): Promise<void>
```
- 显示安装说明
- 询问是否打开下载页面
- 根据平台打开相应的下载链接

##### `getPythonCommand()`
```typescript
export async function getPythonCommand(): Promise<string>
```
- 缓存检测结果
- 避免重复检测
- 返回可用的 Python 命令

#### 2. `config-generator.ts` - 配置生成器更新

**修改**:
```typescript
export async function generateSettingsConfig(
  language: Language,
  claudeDir: string,
  isGlobal: boolean,
  platform: 'mac' | 'windows' | 'linux',
  pythonCommand: string = 'python'  // 新增参数
): Promise<string>
```

**影响**:
- 使用检测到的 Python 命令（`python` 或 `python3`）
- 替换原来的硬编码 `python`

#### 3. `global-hook-installer.ts` - Hook 安装器集成

**修改**:
```typescript
// 在安装 Hook 前检测 Python
const pythonCommand = await getPythonCommand();

// 传递给配置生成器
const settingsContent = await generateSettingsConfig(
  language,
  targetDir,
  isGlobal,
  platformType,
  pythonCommand  // 使用检测到的命令
);
```

---

## 用户体验流程

### 场景 1: Python 在 PATH 中 ✅
```
用户点击"安装 Hook"
  ↓
自动检测到 python/python3
  ↓
静默使用，无任何提示
  ↓
Hook 安装成功
```

### 场景 2: Windows 找到 Python 但不在 PATH 中 🔧
```
用户点击"安装 Hook"
  ↓
检测到 Python 不在 PATH
  ↓
搜索常见目录，找到 C:\Python311
  ↓
弹窗询问:
  "在以下目录找到 Python，但未添加到系统 PATH：
   C:\Python311

   是否要自动添加到用户环境变量？
   （需要重启应用才能生效）"

  [是，添加到 PATH]  [否，稍后手动设置]
  ↓
用户点击"是"
  ↓
自动添加到用户 PATH
  ↓
提示:
  "已成功添加到用户 PATH：
   C:\Python311

   请重启应用以使更改生效。"
  ↓
Hook 安装成功（使用 python）
```

### 场景 3: 完全找不到 Python ⚠️
```
用户点击"安装 Hook"
  ↓
检测不到 Python
  ↓
Windows 搜索也找不到
  ↓
弹窗提示:
  "未找到 Python 安装。

   下载后请确保勾选 'Add Python to PATH' 选项。

   是否要打开 Python 下载页面？"

  [打开下载页面]  [取消]
  ↓
用户点击"打开下载页面"
  ↓
打开浏览器到 https://www.python.org/downloads/windows/
  ↓
Hook 安装继续（使用默认 python3）
  ↓
提示用户安装完成后重新安装 Hook
```

---

## 关键优势

### 1. **零配置体验**
- 大多数用户无需任何手动配置
- 自动检测并使用正确的 Python 命令

### 2. **智能问题解决**
- Windows 上自动搜索 Python 安装
- 一键添加到环境变量
- 避免常见的 "python: command not found" 错误

### 3. **友好的错误处理**
- 清晰的错误提示
- 提供解决方案
- 引导用户完成配置

### 4. **跨平台兼容**
- Windows: 搜索 + 环境变量设置
- macOS/Linux: 提供包管理器命令
- 统一的用户体验

### 5. **性能优化**
- 检测结果缓存
- 避免重复检测
- 异步执行，不阻塞 UI

---

## 测试场景

### Windows 测试

| 场景 | Python 在 PATH | Python 安装位置 | 预期行为 |
|------|---------------|----------------|----------|
| 1 | ✅ | - | 使用 `python`，无提示 |
| 2 | ❌ | `C:\Python311` | 提示添加到 PATH |
| 3 | ❌ | 未安装 | 提示下载安装 |
| 4 | ❌ | `%LOCALAPPDATA%\Programs\Python\Python312` | 提示添加到 PATH |

### macOS 测试

| 场景 | python3 可用 | 预期行为 |
|------|-------------|----------|
| 1 | ✅ | 使用 `python3`，无提示 |
| 2 | ❌ | 提示使用 Homebrew 安装 |

### Linux 测试

| 场景 | python3 可用 | 预期行为 |
|------|-------------|----------|
| 1 | ✅ | 使用 `python3`，无提示 |
| 2 | ❌ | 提示使用包管理器安装 |

---

## 配置示例

### 检测到 `python` 命令
```json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "command": "python \"/Users/user/.claude/hooks/unified-hook.py\""
      }]
    }]
  }
}
```

### 检测到 `python3` 命令
```json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "command": "python3 \"/Users/user/.claude/hooks/unified-hook.py\""
      }]
    }]
  }
}
```

---

## 代码文件清单

### 新增文件
- `src/src/lib/python-detector.ts` - Python 检测和设置逻辑

### 修改文件
- `src/src-tauri/src/commands.rs` - 添加 `check_python_command()` 和 `add_to_user_path()`
- `src/src-tauri/src/main.rs` - 注册新命令
- `src/src/lib/config-generator.ts` - 接收 `pythonCommand` 参数
- `src/src/lib/global-hook-installer.ts` - 集成 Python 检测

---

## 下载链接

| 平台 | 下载链接 |
|------|---------|
| Windows | https://www.python.org/downloads/windows/ |
| macOS | https://www.python.org/downloads/macos/ |
| Linux | 通用: https://www.python.org/downloads/ |

### 推荐安装方式

**Windows**:
- 下载官方安装包
- ✅ **必须勾选**: "Add Python to PATH"
- 推荐版本: Python 3.11 或更高

**macOS**:
```bash
# 使用 Homebrew（推荐）
brew install python3

# 或下载官方 PKG 安装包
```

**Linux**:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3

# Fedora/RHEL
sudo dnf install python3

# Arch
sudo pacman -S python
```

---

## 总结

这个功能大幅提升了用户体验，特别是对于不熟悉命令行或环境变量配置的 Windows 用户。通过智能检测、自动配置和友好提示，将原本复杂的环境配置过程简化为一键操作。
