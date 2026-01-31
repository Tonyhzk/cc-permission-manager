/**
 * 权限模式配置
 */
export interface ModePermissions {
  read: number;
  readAllFiles: number;
  edit: number;
  editAllFiles: number;
  risky: number;
  riskyAllFiles: number;
  useWeb: number;
  useMcp: number;
  allowUnknownCommand: number;
  globalAllow: number;
  globalDeny: number;
}

/**
 * 命令分类配置
 */
export interface CategoryConfig {
  tools: string[];
  commands: string[];
}

/**
 * 所有命令分类
 */
export interface PermissionCategories {
  read: CategoryConfig;
  edit: CategoryConfig;
  risky: CategoryConfig;
  useWeb: CategoryConfig;
  useMcp: CategoryConfig;
  globalAllow: CategoryConfig;
  globalDeny: CategoryConfig;
}

/**
 * 通知配置项
 */
export interface NotificationItem {
  enabled: number;
  title: string;
  message: string;
  sound: string;
  soundWindows: string;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  _soundOptions?: {
    macOS: string[];
    windows: string[];
  };
  enabled: number;
  onCompletion: NotificationItem;
  onPermissionRequest: NotificationItem;
}

/**
 * 权限配置（permissions.json）
 */
export interface PermissionsConfig {
  _comment?: string;
  _description?: {
    modes: string;
    categories: string;
    notifications: string;
  };
  language?: string;
  modes: {
    plan: ModePermissions;
    default: ModePermissions;
    acceptEdits: ModePermissions;
  };
  categories: PermissionCategories;
  notifications: NotificationConfig;
}

/**
 * 分类名称
 */
export type CategoryName = keyof PermissionCategories;

/**
 * 模式名称
 */
export type ModeName = 'plan' | 'default' | 'acceptEdits';
