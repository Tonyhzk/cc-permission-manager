# Windows ARM64 开发环境配置指南

> 本文档记录了在 Mac 上通过虚拟机运行 Windows ARM64，并成功编译运行 Tauri 应用程序的完整过程。

## 环境信息

| 项目 | 版本/信息 |
|------|-----------|
| 宿主机 | macOS (Apple Silicon) |
| 虚拟机 | Windows 11 ARM64 |
| 项目类型 | Tauri 2.0 (React + Rust) |
| Rust 目标 | aarch64-pc-windows-msvc |

---

## 遇到的问题及解决方案

### 问题 1：Rust 未安装

**错误信息：**
```
failed to run 'cargo metadata' command to get workspace directory: program not found
```

**解决方案：**
```powershell
# 使用 winget 安装 Rustup
winget install Rustlang.Rustup --accept-source-agreements --accept-package-agreements

# 刷新环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 设置默认工具链
rustup default stable
```

---

### 问题 2：MSVC 链接器未找到

**错误信息：**
```
error: linker `link.exe` not found
note: the msvc targets depend on the msvc linker but `link.exe` was not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option.
```

**解决方案：**
```powershell
# 安装 Visual Studio Build Tools 2022
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" --accept-source-agreements --accept-package-agreements
```

---

### 问题 3：缺少 ARM64 编译工具

即使安装了 Build Tools，默认可能不包含 ARM64 原生编译工具。

**检查是否有 ARM64 工具：**
```powershell
Get-ChildItem -Path "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\*\bin" -Recurse -Filter "link.exe" | Select-Object -ExpandProperty FullName
```

**安装 ARM64 组件（需要管理员权限）：**
```powershell
Start-Process -FilePath "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vs_installer.exe" -ArgumentList 'modify --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" --add Microsoft.VisualStudio.Component.VC.Tools.ARM64 --passive --norestart' -Verb RunAs -Wait
```

安装后应该能看到：
- `Hostarm64\arm64\link.exe` - ARM64 原生编译器

---

### 问题 4：网络驱动器编译失败

**错误信息：**
```
error: failed to build archive: failed to remove temporary directory: 参数错误。 (os error 87)
```

这是因为项目位于网络驱动器（如 Y:），Rust 编译器在处理临时文件时会出问题。

**解决方案：** 将编译目标目录设置到本地磁盘：
```powershell
# 创建本地编译目录
New-Item -ItemType Directory -Path "C:\temp\cc-permission-target" -Force

# 设置环境变量
set "CARGO_TARGET_DIR=C:\temp\cc-permission-target"
```

---

## 完整的启动命令

将以下命令保存为批处理文件或直接在命令行运行：

```cmd
cmd /c "call ""C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"" arm64 && set ""CARGO_TARGET_DIR=C:\temp\cc-permission-target"" && cd /d Y:\Documents\GitHub\cc-permission\src && pnpm tauri dev"
```

**命令解释：**
1. `vcvarsall.bat arm64` - 初始化 ARM64 编译环境，设置 MSVC 工具链路径
2. `CARGO_TARGET_DIR=C:\temp\...` - 将编译输出目录设置到本地磁盘
3. `pnpm tauri dev` - 启动 Tauri 开发服务器

---

## 依赖安装清单

### 必需组件

| 组件 | 安装命令 |
|------|----------|
| Rustup | `winget install Rustlang.Rustup` |
| VS Build Tools | `winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"` |
| ARM64 工具 | 通过 VS Installer 添加 `Microsoft.VisualStudio.Component.VC.Tools.ARM64` |
| Node.js | `winget install OpenJS.NodeJS.LTS` |
| pnpm | `npm install -g pnpm` |

### 可选组件

| 组件 | 用途 |
|------|------|
| ARM64EC 工具 | 用于 ARM64EC 兼容模式编译 |
| Windows SDK | 某些 Windows API 需要 |

---

## 目录结构说明

```
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\
└── VC\
    ├── Auxiliary\
    │   └── Build\
    │       └── vcvarsall.bat    # 环境初始化脚本
    └── Tools\
        └── MSVC\
            └── 14.44.35207\
                └── bin\
                    ├── Hostarm64\
                    │   ├── arm64\    # ARM64 原生编译器 ✓
                    │   ├── x64\      # 交叉编译到 x64
                    │   └── x86\      # 交叉编译到 x86
                    ├── Hostx64\
                    │   └── arm64\    # x64 主机交叉编译到 ARM64
                    └── Hostx86\
                        └── arm64\    # x86 主机交叉编译到 ARM64
```

---

## 常见问题排查

### Q: 编译时提示找不到 link.exe

**A:** 确保：
1. 已安装 VS Build Tools
2. 已安装 ARM64 组件
3. 运行前执行了 `vcvarsall.bat arm64`

### Q: 编译时出现 "os error 87"

**A:** 项目可能在网络驱动器上，设置 `CARGO_TARGET_DIR` 到本地磁盘。

### Q: 首次编译非常慢

**A:** 正常现象，Rust 需要编译大量依赖。首次编译可能需要 2-5 分钟，后续增量编译会快很多。

### Q: 环境变量不生效

**A:** 新安装的工具需要刷新环境变量：
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

## 参考链接

- [Tauri 官方文档](https://tauri.app/)
- [Rust 官方安装指南](https://www.rust-lang.org/tools/install)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

---

*文档创建日期：2026-01-30*
