# Release 发布指南

## 命名规范

### Tag 格式
```
YYYYMMDD-vX.Y.Z
```
- `YYYYMMDD`: 发布日期（如 20260207）
- `vX.Y.Z`: 版本号（如 v0.4.3）

示例：`20260207-v0.4.3`

### Release 标题
```
vX.Y.Z
```
示例：`v0.4.3`

## 目录结构

```
release/
├── RELEASE_GUIDE.md          # 本文档
├── 0.4.3/                    # 版本目录
│   ├── CC Permission Manager_0.4.3_universal.dmg
│   ├── CC Permission Manager_0.4.3_x64-setup.exe
│   └── CC Permission Manager_0.4.3_x64_en-US.msi
└── X.Y.Z/                    # 其他版本...
```

## 安装包命名规范

| 平台 | 格式 | 命名模板 |
|------|------|----------|
| macOS | DMG | `CC Permission Manager_X.Y.Z_universal.dmg` |
| Windows | EXE | `CC Permission Manager_X.Y.Z_x64-setup.exe` |
| Windows | MSI | `CC Permission Manager_X.Y.Z_x64_en-US.msi` |

## 发布命令

```bash
gh release create "YYYYMMDD-vX.Y.Z" \
  "release/X.Y.Z/CC Permission Manager_X.Y.Z_universal.dmg" \
  "release/X.Y.Z/CC Permission Manager_X.Y.Z_x64-setup.exe" \
  "release/X.Y.Z/CC Permission Manager_X.Y.Z_x64_en-US.msi" \
  --title "vX.Y.Z" \
  --notes "Release vX.Y.Z" \
  --latest
```

## 发布流程

1. 将构建产物放入 `release/X.Y.Z/` 目录
2. 确认文件命名符合规范
3. 执行发布命令（替换版本号和日期）
4. 验证 GitHub Release 页面