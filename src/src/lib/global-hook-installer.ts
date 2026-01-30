import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { generatePermissionsConfig, generateSettingsConfig, generateHookScript, type Language } from './config-generator';
import { useWorkspaceStore } from '@/stores/workspace-store';

export interface InstallResult {
  success: boolean;
  message: string;
  error?: string;
}

export type { Language };
export type Platform = 'macos' | 'windows' | 'linux';

/**
 * 获取当前平台
 */
export async function getCurrentPlatform(): Promise<Platform> {
  const platformName = platform();

  if (platformName === 'macos') return 'macos';
  if (platformName === 'windows') return 'windows';
  return 'linux';
}

/**
 * 获取有效的 .claude 目录（支持工作目录切换）
 */
export async function getEffectiveClaudeDir(): Promise<string> {
  const { getEffectiveClaudeDir } = useWorkspaceStore.getState();
  return await getEffectiveClaudeDir();
}

/**
 * 获取全局 .claude 目录（始终返回 ~/.claude）
 */
export async function getGlobalClaudeDir(): Promise<string> {
  return await invoke<string>('get_claude_config_dir');
}

/**
 * 判断是否为全局目录
 */
export async function isGlobalDir(claudeDir: string): Promise<boolean> {
  const globalDir = await getGlobalClaudeDir();
  // 标准化路径进行比较
  const normalizedClaudeDir = claudeDir.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedGlobalDir = globalDir.replace(/\\/g, '/').replace(/\/$/, '');
  return normalizedClaudeDir === normalizedGlobalDir;
}

/**
 * 获取 settings 文件名（全局用 settings.json，项目级用 settings.local.json）
 */
export async function getSettingsFileName(claudeDir: string): Promise<string> {
  const isGlobal = await isGlobalDir(claudeDir);
  return isGlobal ? 'settings.json' : 'settings.local.json';
}

/**
 * 安装 hooks 到指定目录
 */
export async function installHooks(language: Language, claudeDir?: string): Promise<InstallResult> {
  try {
    // 1. 获取目标目录
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hooksDir = await join(targetDir, 'hooks');

    // 2. 确保目录存在
    await invoke('create_directory', { path: hooksDir });

    // 3. 生成配置内容
    const permissionsConfig = await generatePermissionsConfig(language);
    const permissionsContent = JSON.stringify(permissionsConfig, null, 2);

    // 4. 只在 permissions.json 不存在时才创建
    const permissionsPath = await join(targetDir, 'permissions.json');
    const permissionsExists = await invoke<boolean>('file_exists', { path: permissionsPath });

    if (!permissionsExists) {
      // 首次安装，创建默认配置
      await invoke('write_config_file', {
        path: permissionsPath,
        content: permissionsContent,
      });
    }
    // 如果已存在，保留用户配置，不覆盖

    // 5. 生成硬编码的 hook 脚本
    const hookScriptContent = await generateHookScript(language);
    const hookDestPath = await join(hooksDir, 'unified-hook.py');
    await invoke('write_config_file', {
      path: hookDestPath,
      content: hookScriptContent,
    });

    // 6. 设置 hook 脚本为可执行
    await invoke('set_executable', { path: hookDestPath });

    // 7. 获取当前平台并生成 settings 配置
    const currentPlatform = await getCurrentPlatform();
    const platformType = currentPlatform === 'windows' ? 'windows' : 'mac';
    const settingsContent = await generateSettingsConfig(language, platformType);
    const settingsTemplate = JSON.parse(settingsContent);

    // 8. 根据是否为全局目录选择 settings 文件名
    const settingsFileName = await getSettingsFileName(targetDir);
    const settingsPath = await join(targetDir, settingsFileName);
    const result = await invoke<InstallResult>('merge_hooks_to_settings', {
      settingsPath,
      hooksJson: JSON.stringify(settingsTemplate.hooks),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to merge hooks');
    }

    return {
      success: true,
      message: `Hooks installed successfully to ${targetDir}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to install hooks',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 安装全局 hooks 到 ~/.claude（兼容旧 API）
 */
export async function installGlobalHooks(language: Language): Promise<InstallResult> {
  const globalDir = await getGlobalClaudeDir();
  return installHooks(language, globalDir);
}

/**
 * 卸载 hooks
 */
export async function uninstallHooks(claudeDir?: string): Promise<InstallResult> {
  try {
    // 1. 获取目标目录
    const targetDir = claudeDir || await getEffectiveClaudeDir();

    // 2. 根据是否为全局目录选择 settings 文件名
    const settingsFileName = await getSettingsFileName(targetDir);
    const settingsPath = await join(targetDir, settingsFileName);

    // 3. 检查 settings 文件是否存在
    const exists = await invoke<boolean>('file_exists', { path: settingsPath });
    if (!exists) {
      return {
        success: true,
        message: 'No hooks found',
      };
    }

    // 4. 移除 hooks 配置
    const hookEvents = ['PreToolUse', 'Stop', 'PermissionRequest'];
    const result = await invoke<InstallResult>('remove_hooks_from_settings', {
      settingsPath,
      hookEvents,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to remove hooks');
    }

    return {
      success: true,
      message: 'Hooks uninstalled successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to uninstall hooks',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 卸载全局 hooks（兼容旧 API）
 */
export async function uninstallGlobalHooks(): Promise<InstallResult> {
  const globalDir = await getGlobalClaudeDir();
  return uninstallHooks(globalDir);
}

/**
 * 检查 hooks 是否已安装
 */
export async function isHooksInstalled(claudeDir?: string): Promise<boolean> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hookPath = await join(targetDir, 'hooks', 'unified-hook.py');
    const permissionsPath = await join(targetDir, 'permissions.json');

    const hookExists = await invoke<boolean>('file_exists', { path: hookPath });
    const permissionsExists = await invoke<boolean>('file_exists', { path: permissionsPath });

    return hookExists && permissionsExists;
  } catch {
    return false;
  }
}

/**
 * 检查全局 hooks 是否已安装（兼容旧 API）
 */
export async function isGlobalHooksInstalled(): Promise<boolean> {
  const globalDir = await getGlobalClaudeDir();
  return isHooksInstalled(globalDir);
}

/**
 * 更新 permissions.json
 */
export async function updatePermissions(permissionsJson: string, claudeDir?: string): Promise<InstallResult> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const permissionsPath = await join(targetDir, 'permissions.json');

    await invoke('write_config_file', {
      path: permissionsPath,
      content: permissionsJson,
    });

    return {
      success: true,
      message: 'Permissions updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update permissions',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 更新全局 permissions.json（兼容旧 API）
 */
export async function updateGlobalPermissions(permissionsJson: string): Promise<InstallResult> {
  const globalDir = await getGlobalClaudeDir();
  return updatePermissions(permissionsJson, globalDir);
}

/**
 * 获取当前已安装的 hook 语言
 */
export async function getInstalledHookLanguage(claudeDir?: string): Promise<Language | null> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const permissionsPath = await join(targetDir, 'permissions.json');

    const result = await invoke<{ success: boolean; content?: string; error?: string }>(
      'read_config_file',
      { path: permissionsPath }
    );

    if (!result.success || !result.content) {
      return null;
    }

    const permissions = JSON.parse(result.content);
    return permissions.language || null;
  } catch {
    return null;
  }
}

/**
 * 切换已安装的 hook 语言
 */
export async function switchHookLanguage(newLanguage: Language, claudeDir?: string): Promise<InstallResult> {
  try {
    // 1. 获取目标目录
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hooksDir = await join(targetDir, 'hooks');
    const permissionsPath = await join(targetDir, 'permissions.json');

    // 2. 读取当前的 permissions.json
    const permissionsResult = await invoke<{ success: boolean; content?: string; error?: string }>(
      'read_config_file',
      { path: permissionsPath }
    );

    if (!permissionsResult.success || !permissionsResult.content) {
      throw new Error('Failed to read current permissions.json');
    }

    // 3. 生成新语言的配置模板
    const template = await generatePermissionsConfig(newLanguage);

    // 4. 解析当前配置，只更新语言相关字段
    const currentPermissions = JSON.parse(permissionsResult.content);

    // 更新语言字段
    currentPermissions.language = newLanguage;

    // 更新注释和描述（保留用户的实际配置）
    currentPermissions._comment = template._comment;
    currentPermissions._description = template._description;

    // 更新通知消息文本（保留用户的 enabled 和 sound 配置）
    if (currentPermissions.notifications) {
      if (currentPermissions.notifications.onCompletion) {
        currentPermissions.notifications.onCompletion.title = template.notifications.onCompletion.title;
        currentPermissions.notifications.onCompletion.message = template.notifications.onCompletion.message;
      }
      if (currentPermissions.notifications.onPermissionRequest) {
        currentPermissions.notifications.onPermissionRequest.title = template.notifications.onPermissionRequest.title;
        currentPermissions.notifications.onPermissionRequest.message = template.notifications.onPermissionRequest.message;
      }
    }

    // 5. 写回 permissions.json（保留用户的 modes、categories、notifications 配置）
    await invoke('write_config_file', {
      path: permissionsPath,
      content: JSON.stringify(currentPermissions, null, 2),
    });

    // 6. 重新生成硬编码的 hook 脚本（使用新语言）
    const hookScriptContent = await generateHookScript(newLanguage);
    const hookDestPath = await join(hooksDir, 'unified-hook.py');
    await invoke('write_config_file', {
      path: hookDestPath,
      content: hookScriptContent,
    });

    // 7. 设置 hook 脚本为可执行
    await invoke('set_executable', { path: hookDestPath });

    // 8. 根据是否为全局目录选择 settings 文件名
    const currentPlatform = await getCurrentPlatform();
    const platformType = currentPlatform === 'windows' ? 'windows' : 'mac';
    const settingsContent = await generateSettingsConfig(newLanguage, platformType);
    const settingsTemplate = JSON.parse(settingsContent);

    const settingsFileName = await getSettingsFileName(targetDir);
    const settingsPath = await join(targetDir, settingsFileName);
    const settingsResult = await invoke<InstallResult>('merge_hooks_to_settings', {
      settingsPath,
      hooksJson: JSON.stringify(settingsTemplate.hooks),
    });

    if (!settingsResult.success) {
      throw new Error(settingsResult.error || 'Failed to update settings');
    }

    return {
      success: true,
      message: `Hook language switched to ${newLanguage} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to switch hook language',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
