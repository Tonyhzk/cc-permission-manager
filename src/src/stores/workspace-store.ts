import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';

interface WorkspaceState {
  // 当前工作目录（null 表示使用全局 ~/.claude）
  workspacePath: string | null;
  // 是否正在加载
  isLoading: boolean;
  // 错误信息
  error: string | null;
  // 最近使用的工作目录
  recentWorkspaces: string[];
  // hydration 状态
  _hasHydrated: boolean;

  // 操作
  setWorkspace: (path: string | null) => Promise<void>;
  setWorkspaceWithoutFileAccess: (path: string | null) => void;
  getEffectiveClaudeDir: () => Promise<string>;
  addRecentWorkspace: (path: string) => void;
  removeRecentWorkspace: (path: string) => void;
  clearRecentWorkspaces: () => void;
  setHasHydrated: (state: boolean) => void;
}

/**
 * 获取默认的全局 .claude 目录
 */
async function getGlobalClaudeDir(): Promise<string> {
  return await invoke<string>('get_claude_config_dir');
}

/**
 * 确保目录存在
 */
async function ensureDirectoryExists(path: string): Promise<void> {
  await invoke('create_directory', { path });
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        workspacePath: null,
        isLoading: false,
        error: null,
        recentWorkspaces: [],
        _hasHydrated: false,

        setHasHydrated: (state: boolean) => {
          set({ _hasHydrated: state });
        },

        // 设置工作目录（会访问文件系统确保目录存在）
        setWorkspace: async (path: string | null) => {
          set({ isLoading: true, error: null });
          try {
            if (path) {
              // 确保 .claude 目录存在
              const claudeDir = await join(path, '.claude');
              await ensureDirectoryExists(claudeDir);

              // 确保 hooks 子目录存在
              const hooksDir = await join(claudeDir, 'hooks');
              await ensureDirectoryExists(hooksDir);

              // 添加到最近使用列表
              get().addRecentWorkspace(path);
            }

            set({ workspacePath: path, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to set workspace',
              isLoading: false,
            });
            throw error;
          }
        },

        // 设置工作目录（不访问文件系统，仅更新状态）
        setWorkspaceWithoutFileAccess: (path: string | null) => {
          set({ workspacePath: path });
        },

        // 获取有效的 .claude 目录路径
        getEffectiveClaudeDir: async () => {
          const { workspacePath } = get();
          if (workspacePath) {
            return await join(workspacePath, '.claude');
          }
          return await getGlobalClaudeDir();
        },

        // 添加到最近使用列表
        addRecentWorkspace: (path: string) => {
          const { recentWorkspaces } = get();
          // 移除已存在的相同路径
          const filtered = recentWorkspaces.filter((p) => p !== path);
          // 添加到开头，最多保留 10 个
          const updated = [path, ...filtered].slice(0, 10);
          set({ recentWorkspaces: updated });
        },

        // 从最近使用列表移除
        removeRecentWorkspace: (path: string) => {
          const { recentWorkspaces } = get();
          set({ recentWorkspaces: recentWorkspaces.filter((p) => p !== path) });
        },

        // 清空最近使用列表
        clearRecentWorkspaces: () => {
          set({ recentWorkspaces: [] });
        },
      }),
      {
        name: 'workspace-store',
        partialize: (state) => ({
          workspacePath: state.workspacePath,
          recentWorkspaces: state.recentWorkspaces,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      }
    ),
    { name: 'workspace-store' }
  )
);

/**
 * 等待 hydration 完成的 Promise
 */
export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    const state = useWorkspaceStore.getState();
    if (state._hasHydrated) {
      resolve();
      return;
    }

    const unsubscribe = useWorkspaceStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
};
