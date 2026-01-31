import { useTranslation } from 'react-i18next';
import { FolderOpen, FileText, RefreshCw, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui';
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { useConfigStore, useWorkspaceStore } from '@/stores';
import { useState } from 'react';
import { getSettingsFileName } from '@/lib/global-hook-installer';

export function QuickActions() {
  const { t } = useTranslation();
  const { loadConfig } = useConfigStore();
  const { getEffectiveClaudeDir } = useWorkspaceStore();
  const [isReloading, setIsReloading] = useState(false);

  // 打开 .claude 目录
  const handleOpenClaudeDir = async () => {
    try {
      const claudeDir = await getEffectiveClaudeDir();
      await invoke('open_directory', { path: claudeDir });
    } catch (error) {
      console.error('Failed to open Claude directory:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    }
  };

  // 定位 permissions.json 文件
  const handleLocatePermissionsFile = async () => {
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const permissionsPath = await join(claudeDir, 'permissions.json');
      await invoke('show_in_folder', { path: permissionsPath });
    } catch (error) {
      console.error('Failed to locate permissions file:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    }
  };

  // 定位 settings 文件（根据是否为全局目录选择文件名）
  const handleLocateSettingsFile = async () => {
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const settingsFileName = await getSettingsFileName(claudeDir);
      const settingsPath = await join(claudeDir, settingsFileName);
      await invoke('show_in_folder', { path: settingsPath });
    } catch (error) {
      console.error('Failed to locate settings file:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    }
  };

  // 定位 unified-hook.py 文件
  const handleLocateHookFile = async () => {
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const hookPath = await join(claudeDir, 'hooks', 'unified-hook.py');
      await invoke('show_in_folder', { path: hookPath });
    } catch (error) {
      console.error('Failed to locate hook file:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    }
  };

  // 定位 hook 日志文件
  const handleLocateHookLog = async () => {
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const hookPath = await join(claudeDir, 'hooks', 'unified-hook.py');
      await invoke('locate_hook_log', { hookScriptPath: hookPath });
    } catch (error) {
      console.error('Failed to locate hook log:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    }
  };

  // 重新加载配置
  const handleReload = async () => {
    setIsReloading(true);
    try {
      await loadConfig();
    } catch (error) {
      console.error('Failed to reload config:', error);
      alert(`${t('quickActions.error')}: ${error}`);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenClaudeDir}
        className="gap-2"
      >
        <FolderOpen className="w-4 h-4" />
        {t('quickActions.openClaudeDir')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLocatePermissionsFile}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        {t('quickActions.locatePermissions')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLocateSettingsFile}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        {t('quickActions.locateSettings')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLocateHookFile}
        className="gap-2"
      >
        <FileText className="w-4 h-4" />
        {t('quickActions.locateHook')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLocateHookLog}
        className="gap-2"
      >
        <ScrollText className="w-4 h-4" />
        {t('quickActions.locateHookLog')}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReload}
        disabled={isReloading}
        className="gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
        {t('quickActions.reload')}
      </Button>
    </div>
  );
}
