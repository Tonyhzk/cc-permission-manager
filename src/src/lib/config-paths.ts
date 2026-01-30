import { homeDir, join } from '@tauri-apps/api/path';

/**
 * 获取 Claude Code 配置目录路径
 */
export async function getClaudeConfigDir(): Promise<string> {
  const home = await homeDir();
  return join(home, '.claude');
}

/**
 * 获取全局权限配置文件路径
 */
export async function getPermissionsConfigPath(): Promise<string> {
  const configDir = await getClaudeConfigDir();
  return join(configDir, 'permissions.json');
}

/**
 * 获取全局设置文件路径
 */
export async function getGlobalSettingsPath(): Promise<string> {
  const configDir = await getClaudeConfigDir();
  return join(configDir, 'settings.json');
}
