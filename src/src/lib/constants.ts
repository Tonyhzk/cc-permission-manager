import type { PermissionsConfig } from '@/types';

/**
 * 默认权限配置
 */
export const DEFAULT_PERMISSIONS_CONFIG: PermissionsConfig = {
  _comment: 'Claude Code Permission System Configuration',
  _description: {
    modes: '权限模式配置：0=禁止，1=询问，2=允许',
    categories: '工具和命令分类',
    notifications: '通知设置',
  },
  modes: {
    plan: {
      read: 2,
      readAllFiles: 1,
      edit: 0,
      editAllFiles: 0,
      risky: 0,
      riskyAllFiles: 0,
      useWeb: 2,
      useMcp: 1,
      allowUnknownCommand: 1,
      globalAllow: 2,
      globalDeny: 0,
    },
    default: {
      read: 2,
      readAllFiles: 1,
      edit: 1,
      editAllFiles: 1,
      risky: 1,
      riskyAllFiles: 1,
      useWeb: 2,
      useMcp: 1,
      allowUnknownCommand: 1,
      globalAllow: 2,
      globalDeny: 0,
    },
    acceptEdits: {
      read: 2,
      readAllFiles: 2,
      edit: 2,
      editAllFiles: 2,
      risky: 1,
      riskyAllFiles: 1,
      useWeb: 2,
      useMcp: 2,
      allowUnknownCommand: 1,
      globalAllow: 2,
      globalDeny: 0,
    },
  },
  categories: {
    read: {
      tools: ['Read', 'Glob', 'Grep', 'LS'],
      commands: ['cat', 'head', 'tail', 'less', 'more', 'ls', 'find', 'grep'],
    },
    edit: {
      tools: ['Edit', 'Write', 'MultiEdit'],
      commands: ['sed', 'awk', 'vim', 'nano', 'touch', 'mkdir'],
    },
    risky: {
      tools: ['Bash'],
      commands: ['rm', 'mv', 'cp', 'chmod', 'chown', 'sudo', 'git push', 'npm publish'],
    },
    useWeb: {
      tools: ['WebFetch', 'WebSearch'],
      commands: ['curl', 'wget'],
    },
    useMcp: {
      tools: [],
      commands: [],
    },
    globalAllow: {
      tools: [],
      commands: [],
    },
    globalDeny: {
      tools: [],
      commands: ['rm -rf /', 'sudo rm -rf', ':(){:|:&};:'],
    },
  },
  notifications: {
    _soundOptions: {
      macOS: ['default', 'Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'],
      windows: ['default', 'ms-winsoundevent:Notification.Default', 'ms-winsoundevent:Notification.IM', 'ms-winsoundevent:Notification.Mail', 'ms-winsoundevent:Notification.Reminder'],
    },
    enabled: 1,
    onCompletion: {
      enabled: 1,
      title: 'Task Completed',
      message: 'Claude Code has finished the task',
      sound: 'Glass',
      soundWindows: 'ms-winsoundevent:Notification.Default',
    },
    onPermissionRequest: {
      enabled: 1,
      title: 'Permission Required',
      message: 'Claude Code needs your approval',
      sound: 'Ping',
      soundWindows: 'ms-winsoundevent:Notification.IM',
    },
  },
};

/**
 * 权限值映射
 */
export const PERMISSION_VALUES = {
  DENY: 0,
  ASK: 1,
  ALLOW: 2,
} as const;

/**
 * 权限值标签
 */
export const PERMISSION_LABELS: Record<number, string> = {
  0: 'Deny',
  1: 'Ask',
  2: 'Allow',
};

/**
 * 模式名称映射
 */
export const MODE_LABELS: Record<string, string> = {
  plan: 'Plan Mode',
  default: 'Default Mode',
  acceptEdits: 'Accept Edits Mode',
};

/**
 * 分类名称映射
 */
export const CATEGORY_LABELS: Record<string, string> = {
  read: 'Read Operations',
  edit: 'Edit Operations',
  risky: 'Risky Operations',
  useWeb: 'Web Access',
  useMcp: 'MCP Tools',
  globalAllow: 'Global Allow',
  globalDeny: 'Global Deny',
};

/**
 * 权限字段描述
 */
export const PERMISSION_FIELD_DESCRIPTIONS: Record<string, string> = {
  read: 'Read files in the current directory',
  readAllFiles: 'Read files outside the current directory',
  edit: 'Edit files in the current directory',
  editAllFiles: 'Edit files outside the current directory',
  risky: 'Execute risky commands in the current directory',
  riskyAllFiles: 'Execute risky commands outside the current directory',
  useWeb: 'Access web resources (fetch, search)',
  useMcp: 'Use MCP (Model Context Protocol) tools',
  allowUnknownCommand: 'Allow unknown/unrecognized commands',
  globalAllow: 'Commands in global allow list',
  globalDeny: 'Commands in global deny list',
};
