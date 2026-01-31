import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { platform } from '@tauri-apps/plugin-os';

export type PermissionStatus = 'checking' | 'granted' | 'denied' | 'not-applicable';

interface PermissionState {
  // 权限状态
  permissionStatus: PermissionStatus;
  // 是否显示权限对话框
  showPermissionDialog: boolean;
  // 本次会话中用户是否已确认授权
  hasConfirmedThisSession: boolean;

  // 操作
  setPermissionStatus: (status: PermissionStatus) => void;
  setShowPermissionDialog: (show: boolean) => void;
  setHasConfirmedThisSession: (confirmed: boolean) => void;
  checkPermission: (workspacePath: string | null) => Promise<boolean>;
}

/**
 * 检查路径是否在受保护文件夹中
 */
function isInProtectedFolder(path: string): boolean {
  return (
    path.includes('/Documents/') ||
    path.includes('/Documents') ||
    path.includes('/Desktop/') ||
    path.includes('/Desktop') ||
    path.includes('/Downloads/') ||
    path.includes('/Downloads')
  );
}

export const usePermissionStore = create<PermissionState>()(
  devtools(
    (set, get) => ({
      permissionStatus: 'checking',
      showPermissionDialog: false,
      hasConfirmedThisSession: false,

      setPermissionStatus: (status) => {
        set({ permissionStatus: status });
      },

      setShowPermissionDialog: (show) => {
        set({ showPermissionDialog: show });
      },

      setHasConfirmedThisSession: (confirmed) => {
        set({ hasConfirmedThisSession: confirmed });
      },

      /**
       * 检查 macOS 文件访问权限
       * 不会调用任何后端文件访问方法，仅根据平台和路径判断
       * @param workspacePath 工作目录路径
       * @returns 是否可以继续（true=可以继续加载；false=需要等待用户选择）
       */
      checkPermission: async (workspacePath: string | null): Promise<boolean> => {
        try {
          const currentPlatform = platform();

          // 非 macOS，直接返回可以继续
          if (currentPlatform !== 'macos') {
            set({ permissionStatus: 'not-applicable', showPermissionDialog: false });
            return true;
          }

          // 检查本次会话是否已确认
          const { hasConfirmedThisSession } = get();

          if (hasConfirmedThisSession) {
            // 本次会话已确认，继续加载
            set({ permissionStatus: 'granted', showPermissionDialog: false });
            return true;
          }

          // macOS 且有工作目录在受保护文件夹中，显示引导
          if (workspacePath && isInProtectedFolder(workspacePath)) {
            set({ permissionStatus: 'denied', showPermissionDialog: true });
            return false;
          }

          // 全局模式或非受保护目录，不需要特殊引导
          set({ permissionStatus: 'not-applicable', showPermissionDialog: false });
          return true;
        } catch (error) {
          console.error('Failed to check permission:', error);
          // 出错时假设可以继续
          set({ permissionStatus: 'not-applicable', showPermissionDialog: false });
          return true;
        }
      },
    }),
    { name: 'permission-store' }
  )
);
