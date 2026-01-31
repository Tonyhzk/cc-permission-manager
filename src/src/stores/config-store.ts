import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import type { PermissionsConfig, CategoryName, ModeName, ModePermissions } from '@/types';
import { useWorkspaceStore } from './workspace-store';
import i18n from '@/locales/i18n';
import { generatePermissionsConfig, type Language } from '@/lib/config-generator';

// 缓存的默认配置
let cachedDefaultConfig: PermissionsConfig | null = null;

/**
 * 获取当前语言对应的模板语言代码
 */
function getTemplateLanguage(): Language {
  const lang = i18n.language || 'zh';
  return lang.startsWith('zh') ? 'zh_CN' : 'en_US';
}

/**
 * 从模板文件加载默认配置（使用 config-generator 保持一致性）
 */
async function loadDefaultConfig(): Promise<PermissionsConfig> {
  try {
    const language = getTemplateLanguage();
    const config = await generatePermissionsConfig(language);
    cachedDefaultConfig = config;
    return config;
  } catch (error) {
    console.error('Failed to load default config from template:', error);
  }

  // 如果有缓存，返回缓存
  if (cachedDefaultConfig) {
    return cachedDefaultConfig;
  }

  // 最后的 fallback
  throw new Error('Failed to load default configuration');
}

/**
 * 深度合并配置，确保所有字段都有值
 */
function mergeWithDefaults(loaded: Partial<PermissionsConfig>, defaults: PermissionsConfig): PermissionsConfig {
  return {
    _comment: loaded._comment ?? defaults._comment,
    _description: loaded._description ?? defaults._description,
    modes: {
      plan: { ...defaults.modes.plan, ...loaded.modes?.plan },
      default: { ...defaults.modes.default, ...loaded.modes?.default },
      acceptEdits: { ...defaults.modes.acceptEdits, ...loaded.modes?.acceptEdits },
    },
    categories: {
      read: {
        tools: loaded.categories?.read?.tools ?? defaults.categories.read.tools,
        commands: loaded.categories?.read?.commands ?? defaults.categories.read.commands,
      },
      edit: {
        tools: loaded.categories?.edit?.tools ?? defaults.categories.edit.tools,
        commands: loaded.categories?.edit?.commands ?? defaults.categories.edit.commands,
      },
      risky: {
        tools: loaded.categories?.risky?.tools ?? defaults.categories.risky.tools,
        commands: loaded.categories?.risky?.commands ?? defaults.categories.risky.commands,
      },
      useWeb: {
        tools: loaded.categories?.useWeb?.tools ?? defaults.categories.useWeb.tools,
        commands: loaded.categories?.useWeb?.commands ?? defaults.categories.useWeb.commands,
      },
      useMcp: {
        tools: loaded.categories?.useMcp?.tools ?? defaults.categories.useMcp.tools,
        commands: loaded.categories?.useMcp?.commands ?? defaults.categories.useMcp.commands,
      },
      globalAllow: {
        tools: loaded.categories?.globalAllow?.tools ?? defaults.categories.globalAllow.tools,
        commands: loaded.categories?.globalAllow?.commands ?? defaults.categories.globalAllow.commands,
      },
      globalDeny: {
        tools: loaded.categories?.globalDeny?.tools ?? defaults.categories.globalDeny.tools,
        commands: loaded.categories?.globalDeny?.commands ?? defaults.categories.globalDeny.commands,
      },
    },
    notifications: {
      _soundOptions: loaded.notifications?._soundOptions ?? defaults.notifications._soundOptions,
      enabled: loaded.notifications?.enabled ?? defaults.notifications.enabled,
      onCompletion: {
        ...defaults.notifications.onCompletion,
        ...loaded.notifications?.onCompletion,
      },
      onPermissionRequest: {
        ...defaults.notifications.onPermissionRequest,
        ...loaded.notifications?.onPermissionRequest,
      },
    },
  };
}

interface ConfigState {
  // 配置数据
  config: PermissionsConfig;
  originalConfig: PermissionsConfig | null;

  // 状态
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;

  // 操作
  setConfig: (config: PermissionsConfig) => void;
  updateModePermission: (mode: ModeName, field: keyof ModePermissions, value: number) => void;
  addCategoryItem: (category: CategoryName, type: 'tools' | 'commands', item: string) => void;
  removeCategoryItem: (category: CategoryName, type: 'tools' | 'commands', item: string) => void;
  updateCategoryItems: (category: CategoryName, type: 'tools' | 'commands', items: string[]) => void;
  updateNotificationSetting: (path: string, value: unknown) => void;

  // 持久化
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  discardChanges: () => void;
}

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set, get) => ({
      // 初始状态 - config 为 null，loadConfig 后才有值
      config: null as unknown as PermissionsConfig,
      originalConfig: null,
      isLoading: true, // 初始为 true，表示正在加载
      isSaving: false,
      hasChanges: false,
      error: null,

      // 设置配置
      setConfig: (config) => {
        set({
          config,
          originalConfig: JSON.parse(JSON.stringify(config)),
          hasChanges: false,
        });
      },

      // 更新模式权限
      updateModePermission: (mode, field, value) => {
        const { config } = get();
        const newConfig = {
          ...config,
          modes: {
            ...config.modes,
            [mode]: {
              ...config.modes[mode],
              [field]: value,
            },
          },
        };
        set({ config: newConfig, hasChanges: true });
      },

      // 添加分类项
      addCategoryItem: (category, type, item) => {
        const { config } = get();
        const currentItems = config.categories[category][type];
        if (currentItems.includes(item)) return;

        const newConfig = {
          ...config,
          categories: {
            ...config.categories,
            [category]: {
              ...config.categories[category],
              [type]: [...currentItems, item],
            },
          },
        };
        set({ config: newConfig, hasChanges: true });
      },

      // 移除分类项
      removeCategoryItem: (category, type, item) => {
        const { config } = get();
        const newConfig = {
          ...config,
          categories: {
            ...config.categories,
            [category]: {
              ...config.categories[category],
              [type]: config.categories[category][type].filter((i) => i !== item),
            },
          },
        };
        set({ config: newConfig, hasChanges: true });
      },

      // 批量更新分类项
      updateCategoryItems: (category, type, items) => {
        const { config } = get();
        const newConfig = {
          ...config,
          categories: {
            ...config.categories,
            [category]: {
              ...config.categories[category],
              [type]: items,
            },
          },
        };
        set({ config: newConfig, hasChanges: true });
      },

      // 更新通知设置
      updateNotificationSetting: (path, value) => {
        const { config } = get();
        const newConfig = { ...config };
        const parts = path.split('.');
        let current: Record<string, unknown> = newConfig.notifications as unknown as Record<string, unknown>;

        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]] as Record<string, unknown>;
        }
        current[parts[parts.length - 1]] = value;

        set({ config: newConfig, hasChanges: true });
      },

      // 加载配置
      loadConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          // 获取有效的 .claude 目录（支持工作目录切换）
          const { getEffectiveClaudeDir } = useWorkspaceStore.getState();
          const claudeDir = await getEffectiveClaudeDir();
          const permissionsPath = await join(claudeDir, 'permissions.json');

          // 检查文件是否存在
          const exists = await invoke<boolean>('file_exists', { path: permissionsPath });

          let config: PermissionsConfig;

          if (exists) {
            // 读取用户配置
            const result = await invoke<{ success: boolean; content?: string; error?: string }>(
              'read_config_file',
              { path: permissionsPath }
            );

            if (result.success && result.content) {
              // 解析并与默认值合并，确保所有字段都有值
              const loaded = JSON.parse(result.content);
              const defaults = await loadDefaultConfig();
              config = mergeWithDefaults(loaded, defaults);
            } else {
              // 读取失败，使用默认配置
              config = await loadDefaultConfig();
            }
          } else {
            // 文件不存在，使用默认配置
            config = await loadDefaultConfig();
          }

          set({
            config,
            originalConfig: JSON.parse(JSON.stringify(config)),
            isLoading: false,
            hasChanges: false,
          });
        } catch (error) {
          const defaults = await loadDefaultConfig();
          set({
            error: error instanceof Error ? error.message : 'Failed to load config',
            isLoading: false,
            config: defaults,
            originalConfig: JSON.parse(JSON.stringify(defaults)),
          });
        }
      },

      // 保存配置
      saveConfig: async () => {
        set({ isSaving: true, error: null });
        try {
          const { config } = get();

          // 获取有效的 .claude 目录（支持工作目录切换）
          const { getEffectiveClaudeDir } = useWorkspaceStore.getState();
          const claudeDir = await getEffectiveClaudeDir();
          const permissionsPath = await join(claudeDir, 'permissions.json');

          // 格式化 JSON
          const jsonContent = JSON.stringify(config, null, 2);

          // 写入文件
          await invoke('write_config_file', {
            path: permissionsPath,
            content: jsonContent,
          });

          set({
            originalConfig: JSON.parse(JSON.stringify(config)),
            isSaving: false,
            hasChanges: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save config',
            isSaving: false,
          });
        }
      },

      // 重置为默认值
      resetToDefaults: async () => {
        const defaults = await loadDefaultConfig();
        set({
          config: defaults,
          hasChanges: true,
        });
      },

      // 放弃更改
      discardChanges: () => {
        const { originalConfig } = get();
        if (originalConfig) {
          set({
            config: JSON.parse(JSON.stringify(originalConfig)),
            hasChanges: false,
          });
        }
      },
    }),
    { name: 'config-store' }
  )
);
