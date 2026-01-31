import { invoke } from '@tauri-apps/api/core';
import { platform } from '@tauri-apps/plugin-os';

export interface PythonCheckResult {
  command: string;
  found_in_path: boolean;
  installation_paths: string[];
}

export type PythonStatus =
  | { type: 'success'; command: string }
  | { type: 'warning'; path: string; scriptsPath: string }
  | { type: 'error'; platform: string }
  | null;

export type PythonStatusCallback = (status: PythonStatus) => void;

/**
 * 检测 Python 命令并处理未找到的情况
 * @param onStatusChange 状态变化回调函数
 * @returns Python 命令名称 ("python" 或 "python3")
 */
export async function detectAndSetupPython(
  onStatusChange?: PythonStatusCallback
): Promise<string> {
  const result = await invoke<PythonCheckResult>('check_python_command');

  // 如果在 PATH 中找到了，通知状态并返回
  if (result.found_in_path) {
    onStatusChange?.({ type: 'success', command: result.command });
    return result.command;
  }

  // 未在 PATH 中找到
  const platformName = platform();

  // Windows: 尝试在常见目录查找
  if (platformName === 'windows' && result.installation_paths.length > 0) {
    const pythonPath = result.installation_paths[0];
    const scriptsPath = `${pythonPath}\\Scripts`;
    onStatusChange?.({ type: 'warning', path: pythonPath, scriptsPath });
    return 'python';
  }

  // 其他平台或 Windows 上也找不到：提示用户安装
  onStatusChange?.({ type: 'error', platform: platformName });

  // 返回默认值
  return result.command;
}


/**
 * 获取可用的 Python 命令（缓存结果）
 */
let cachedPythonCommand: string | null = null;

export async function getPythonCommand(
  onStatusChange?: PythonStatusCallback
): Promise<string> {
  if (cachedPythonCommand) {
    return cachedPythonCommand;
  }

  cachedPythonCommand = await detectAndSetupPython(onStatusChange);
  return cachedPythonCommand;
}

/**
 * 重置缓存的 Python 命令（用于重新检测）
 */
export function resetPythonCommandCache(): void {
  cachedPythonCommand = null;
}
