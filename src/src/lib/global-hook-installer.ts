import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { generatePermissionsConfig, generateSettingsConfig, generateHookScript, type Language } from './config-generator';
import type { PermissionsConfig } from '@/types';
import { useConfigStore, useWorkspaceStore } from '@/stores';
import { getPythonCommand, resetPythonCommandCache, type PythonStatusCallback } from './python-detector';

export interface InstallResult {
  success: boolean;
  message: string;
  error?: string;
}

export type { Language };
export type Platform = 'macos' | 'windows' | 'linux';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeMissingFields<T>(current: T, template: T): T {
  if (Array.isArray(current) || Array.isArray(template)) {
    return current ?? template;
  }

  if (!isPlainObject(current) || !isPlainObject(template)) {
    return current ?? template;
  }

  const merged: Record<string, unknown> = { ...current };

  for (const [key, templateValue] of Object.entries(template)) {
    const currentValue = merged[key];

    if (currentValue === undefined) {
      merged[key] = templateValue;
      continue;
    }

    if (isPlainObject(currentValue) && isPlainObject(templateValue)) {
      merged[key] = mergeMissingFields(currentValue, templateValue);
    }
  }

  return merged as T;
}

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
export async function installHooks(
  language: Language,
  claudeDir?: string,
  onPythonStatusChange?: PythonStatusCallback
): Promise<InstallResult> {
  try {
    // 1. 清除 Python 命令缓存，确保每次都重新检测
    resetPythonCommandCache();

    // 2. 获取目标目录
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hooksDir = await join(targetDir, 'hooks');

    // 2. 确保目录存在
    await invoke('create_directory', { path: hooksDir });

    // 3. 生成配置内容
    const permissionsConfig = await generatePermissionsConfig(language);
    const permissionsContent = JSON.stringify(permissionsConfig, null, 2);

    // 4. 创建或补全 permissions.json
    const permissionsPath = await join(targetDir, 'permissions.json');
    const permissionsExists = await invoke<boolean>('file_exists', { path: permissionsPath });

    if (!permissionsExists) {
      await invoke('write_config_file', {
        path: permissionsPath,
        content: permissionsContent,
      });
    } else {
      const permissionsResult = await invoke<{ success: boolean; content?: string; error?: string }>(
        'read_config_file',
        { path: permissionsPath }
      );

      if (!permissionsResult.success || !permissionsResult.content) {
        throw new Error(permissionsResult.error || 'Failed to read current permissions.json');
      }

      const currentPermissions = JSON.parse(permissionsResult.content) as PermissionsConfig;
      const mergedPermissions = mergeMissingFields(currentPermissions, permissionsConfig);

      await invoke('write_config_file', {
        path: permissionsPath,
        content: JSON.stringify(mergedPermissions, null, 2),
      });
    }

    // 5. 生成硬编码的 hook 脚本
    const hookScriptContent = await generateHookScript(language);
    const hookDestPath = await join(hooksDir, 'unified-hook.py');
    await invoke('write_config_file', {
      path: hookDestPath,
      content: hookScriptContent,
    });

    // 6. 设置 hook 脚本为可执行
    await invoke('set_executable', { path: hookDestPath });

    // 7. 检测 Python 命令
    const pythonCommand = await getPythonCommand(onPythonStatusChange);

    // 8. 获取当前平台并生成 settings 配置
    const currentPlatform = await getCurrentPlatform();
    const platformType = currentPlatform === 'macos' ? 'mac' : currentPlatform;
    const isGlobal = await isGlobalDir(targetDir);
    const settingsContent = await generateSettingsConfig(language, targetDir, isGlobal, platformType, pythonCommand);
    const settingsTemplate = JSON.parse(settingsContent);

    // 9. 根据是否为全局目录选择 settings 文件名
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
export async function installGlobalHooks(
  language: Language,
  onPythonStatusChange?: PythonStatusCallback
): Promise<InstallResult> {
  const globalDir = await getGlobalClaudeDir();
  return installHooks(language, globalDir, onPythonStatusChange);
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
 * Hook 安装状态类型
 */
export type HookInstallStatus = 'installed' | 'partial' | 'not_installed' | 'modified';

/**
 * Hook 检测结果
 */
export interface HookCheckResult {
  status: HookInstallStatus;   // 只反映 Settings 层面的状态
  scriptExists: boolean;       // unified-hook.py 是否存在
  permissionsExist: boolean;   // permissions.json 是否存在
  settingsHooksValid: boolean; // settings.json hooks 配置是否完整
  missingEvents: string[];     // Settings 中缺失的 hook 事件名
  modifiedEvents: string[];    // Settings 中被修改的事件名（事件存在但不含 unified-hook.py）
  scriptModified: boolean;     // 脚本内容与当前模板是否不同
}

/**
 * 需要检测的 hook 事件列表
 */
const REQUIRED_HOOK_EVENTS = ['PreToolUse', 'Stop', 'PermissionRequest'] as const;

/**
 * 检测 Hook 安装状态的详细信息
 */
export async function checkHookStatus(claudeDir?: string): Promise<HookCheckResult> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hookPath = await join(targetDir, 'hooks', 'unified-hook.py');
    const permissionsPath = await join(targetDir, 'permissions.json');

    // 检查脚本和配置文件是否存在
    const scriptExists = await invoke<boolean>('file_exists', { path: hookPath });
    const permissionsExist = await invoke<boolean>('file_exists', { path: permissionsPath });

    // 如果脚本和配置文件都不存在，属于未安装
    if (!scriptExists && !permissionsExist) {
      return {
        status: 'not_installed',
        scriptExists: false,
        permissionsExist: false,
        settingsHooksValid: false,
        missingEvents: [...REQUIRED_HOOK_EVENTS],
        modifiedEvents: [],
        scriptModified: false,
      };
    }

    // 检查脚本内容是否与当前模板不同
    let scriptModified = false;
    if (scriptExists) {
      const scriptResult = await invoke<{ success: boolean; content?: string; error?: string }>(
        'read_config_file',
        { path: hookPath }
      );
      if (scriptResult.success && scriptResult.content) {
        const currentLanguage = useConfigStore.getState().config?.language || 'zh_CN';
        const latestScript = await generateHookScript(currentLanguage as Language);
        scriptModified = scriptResult.content !== latestScript;
      }
    }

    // 检查 settings.json 中的 hooks 配置
    const settingsFileName = await getSettingsFileName(targetDir);
    const settingsPath = await join(targetDir, settingsFileName);
    const settingsExists = await invoke<boolean>('file_exists', { path: settingsPath });

    if (!settingsExists) {
      return {
        status: 'partial',
        scriptExists,
        permissionsExist,
        settingsHooksValid: false,
        missingEvents: [...REQUIRED_HOOK_EVENTS],
        modifiedEvents: [],
        scriptModified,
      };
    }

    // 读取 settings.json 检查 hooks 配置
    const settingsResult = await invoke<{ success: boolean; content?: string; error?: string }>(
      'read_config_file',
      { path: settingsPath }
    );

    if (!settingsResult.success || !settingsResult.content) {
      return {
        status: 'partial',
        scriptExists,
        permissionsExist,
        settingsHooksValid: false,
        missingEvents: [...REQUIRED_HOOK_EVENTS],
        modifiedEvents: [],
        scriptModified,
      };
    }

    try {
      const settings = JSON.parse(settingsResult.content);
      const hooks = settings.hooks;

      if (!hooks || typeof hooks !== 'object') {
        return {
          status: 'partial',
          scriptExists,
          permissionsExist,
          settingsHooksValid: false,
          missingEvents: [...REQUIRED_HOOK_EVENTS],
          modifiedEvents: [],
          scriptModified,
        };
      }

      // 检查每个必要的 hook 事件
      const missingEvents: string[] = [];
      const modifiedEvents: string[] = [];
      for (const eventName of REQUIRED_HOOK_EVENTS) {
        const eventHooks = hooks[eventName];
        if (!Array.isArray(eventHooks) || eventHooks.length === 0) {
          missingEvents.push(eventName);
          continue;
        }

        // 检查事件中是否有指向 unified-hook.py 的 hook
        const hasOurHook = eventHooks.some((rule: any) => {
          if (!rule.hooks || !Array.isArray(rule.hooks)) return false;
          return rule.hooks.some((hook: any) =>
            hook.type === 'command' && hook.command && hook.command.includes('unified-hook.py')
          );
        });

        if (!hasOurHook) {
          modifiedEvents.push(eventName);
        }
      }

      // status 只看 Settings 层面，scriptModified 独立返回
      if (missingEvents.length === 0 && modifiedEvents.length === 0) {
        return {
          status: 'installed',
          scriptExists,
          permissionsExist,
          settingsHooksValid: true,
          missingEvents: [],
          modifiedEvents: [],
          scriptModified,
        };
      }

      // 有缺失事件 → partial
      if (modifiedEvents.length === 0) {
        return {
          status: 'partial',
          scriptExists,
          permissionsExist,
          settingsHooksValid: false,
          missingEvents,
          modifiedEvents: [],
          scriptModified,
        };
      }

      // 有被修改的事件 → modified
      return {
        status: 'modified',
        scriptExists,
        permissionsExist,
        settingsHooksValid: false,
        missingEvents,
        modifiedEvents,
        scriptModified,
      };
    } catch {
      return {
        status: 'partial',
        scriptExists,
        permissionsExist,
        settingsHooksValid: false,
        missingEvents: [...REQUIRED_HOOK_EVENTS],
        modifiedEvents: [],
        scriptModified,
      };
    }
  } catch {
    return {
      status: 'not_installed',
      scriptExists: false,
      permissionsExist: false,
      settingsHooksValid: false,
      missingEvents: [...REQUIRED_HOOK_EVENTS],
      modifiedEvents: [],
      scriptModified: false,
    };
  }
}

/**
 * 检查 hooks 是否已安装（简化版，保留兼容）
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
export async function switchHookLanguage(
  newLanguage: Language,
  claudeDir?: string,
  onPythonStatusChange?: PythonStatusCallback
): Promise<InstallResult> {
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

    // 8. 检测 Python 命令
    const pythonCommand = await getPythonCommand(onPythonStatusChange);

    // 9. 根据是否为全局目录选择 settings 文件名
    const currentPlatform = await getCurrentPlatform();
    const platformType = currentPlatform === 'macos' ? 'mac' : currentPlatform;
    const isGlobal = await isGlobalDir(targetDir);
    const settingsContent = await generateSettingsConfig(newLanguage, targetDir, isGlobal, platformType, pythonCommand);
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

/**
 * 仅修复 Settings 中的 hooks 配置（合并补全，保留用户原有值）
 */
export async function repairSettings(
  claudeDir?: string,
  onPythonStatusChange?: PythonStatusCallback
): Promise<InstallResult> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();

    // 1. 检测 Python 命令
    const pythonCommand = await getPythonCommand(onPythonStatusChange);

    // 2. 生成模板 hooks 配置
    const currentLanguage = useConfigStore.getState().config?.language || 'zh_CN';
    const currentPlatform = await getCurrentPlatform();
    const platformType = currentPlatform === 'macos' ? 'mac' : currentPlatform;
    const isGlobal = await isGlobalDir(targetDir);
    const settingsContent = await generateSettingsConfig(currentLanguage as Language, targetDir, isGlobal, platformType, pythonCommand);
    const settingsTemplate = JSON.parse(settingsContent);

    // 3. 合并到 settings.json
    const settingsFileName = await getSettingsFileName(targetDir);
    const settingsPath = await join(targetDir, settingsFileName);
    const result = await invoke<InstallResult>('merge_hooks_to_settings', {
      settingsPath,
      hooksJson: JSON.stringify(settingsTemplate.hooks),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to repair settings');
    }

    return {
      success: true,
      message: 'Settings hooks repaired successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to repair settings',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 仅修复 Hook 脚本（整体替换为当前模板）
 */
export async function repairScript(
  claudeDir?: string
): Promise<InstallResult> {
  try {
    const targetDir = claudeDir || await getEffectiveClaudeDir();
    const hooksDir = await join(targetDir, 'hooks');

    // 1. 确保目录存在
    await invoke('create_directory', { path: hooksDir });

    // 2. 生成最新脚本
    const currentLanguage = useConfigStore.getState().config?.language || 'zh_CN';
    const hookScriptContent = await generateHookScript(currentLanguage as Language);
    const hookDestPath = await join(hooksDir, 'unified-hook.py');

    // 3. 整体替换
    await invoke('write_config_file', {
      path: hookDestPath,
      content: hookScriptContent,
    });

    // 4. 设置可执行
    await invoke('set_executable', { path: hookDestPath });

    return {
      success: true,
      message: 'Hook script updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to repair hook script',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
