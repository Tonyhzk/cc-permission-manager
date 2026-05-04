import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  installHooks,
  uninstallHooks,
  checkHookStatus,
  switchHookLanguage,
  repairSettings,
  repairScript,
  isGlobalDir,
  type Language,
  type HookCheckResult,
} from '@/lib/global-hook-installer';
import { useConfigStore, useWorkspaceStore } from '@/stores';
import { CheckCircle2, XCircle, Download, Trash2, Loader2, Languages, RotateCcw, AlertTriangle, FileCode, Settings } from 'lucide-react';
import { PythonStatusCard, type PythonStatus } from './PythonStatusCard';

const AUTO_REPAIR_KEY = 'cc-permission-manager-auto-repair';

export function GlobalHookInstaller() {
  const { t, i18n } = useTranslation();
  const { loadConfig, resetToDefaults, saveConfig, config } = useConfigStore();
  const { workspacePath, getEffectiveClaudeDir } = useWorkspaceStore();
  const [hookStatus, setHookStatus] = useState<HookCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [isRepairingSettings, setIsRepairingSettings] = useState(false);
  const [isRepairingScript, setIsRepairingScript] = useState(false);
  const [settingsFileName, setSettingsFileName] = useState('settings.json');
  const [pythonStatus, setPythonStatus] = useState<PythonStatus>(null);

  // 自动修复开关状态（localStorage 持久化，默认开启）
  const [autoRepairEnabled, setAutoRepairEnabled] = useState(() => {
    const stored = localStorage.getItem(AUTO_REPAIR_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  // 从配置中获取当前语言
  const getConfigLanguage = (): Language => {
    if (config?.language) {
      return config.language as Language;
    }
    if (config?._comment && /[一-龥]/.test(config._comment)) {
      return 'zh_CN';
    }
    return 'en_US';
  };
  const installedLanguage = getConfigLanguage();

  // 保存自动修复开关状态
  const handleAutoRepairChange = (enabled: boolean) => {
    setAutoRepairEnabled(enabled);
    localStorage.setItem(AUTO_REPAIR_KEY, String(enabled));
  };

  // 检查安装状态
  const checkInstallStatus = async () => {
    setIsChecking(true);
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const result = await checkHookStatus(claudeDir);
      setHookStatus(result);

      const isGlobal = await isGlobalDir(claudeDir);
      setSettingsFileName(isGlobal ? 'settings.json' : 'settings.local.json');
    } catch (error) {
      console.error('Failed to check install status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkInstallStatus();
  }, [workspacePath]);

  // 自动修复：分离 Settings 和 Script 的修复
  useEffect(() => {
    if (!hookStatus || isChecking || isLoading || isRepairingSettings || isRepairingScript) return;

    const hasSettingsIssue = hookStatus.status === 'partial';
    // Settings modified 不自动修，用户有意改的
    const hasScriptIssue = hookStatus.scriptModified;

    if (!autoRepairEnabled) return;

    if (hasSettingsIssue) {
      handleRepairSettings();
    }
    if (hasScriptIssue) {
      handleRepairScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookStatus, autoRepairEnabled, isChecking]);

  // 成功消息自动消失
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 安装 hooks
  const handleInstall = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const language = i18n.language.startsWith('zh') ? 'zh_CN' : 'en_US';
      const claudeDir = await getEffectiveClaudeDir();
      const result = await installHooks(language as Language, claudeDir, (status) => {
        setPythonStatus(status);
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadConfig();
      } else {
        setMessage({ type: 'error', text: result.error || result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
      await checkInstallStatus();
    }
  };

  // 卸载 hooks
  const handleUninstall = async () => {
    setIsLoading(true);
    setMessage(null);
    setShowUninstallDialog(false);

    try {
      const claudeDir = await getEffectiveClaudeDir();
      const result = await uninstallHooks(claudeDir);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error || result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
      await checkInstallStatus();
    }
  };

  // 修复 Settings hooks 配置
  const handleRepairSettings = async () => {
    setIsRepairingSettings(true);
    setMessage(null);

    try {
      const claudeDir = await getEffectiveClaudeDir();
      const result = await repairSettings(claudeDir, (status) => {
        setPythonStatus(status);
      });

      if (result.success) {
        setMessage({ type: 'success', text: t('hooks.repairSettingsSuccess') });
        await loadConfig();
      } else {
        setMessage({ type: 'error', text: result.error || result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsRepairingSettings(false);
      await checkInstallStatus();
    }
  };

  // 修复 Hook 脚本
  const handleRepairScript = async () => {
    setIsRepairingScript(true);
    setMessage(null);

    try {
      const claudeDir = await getEffectiveClaudeDir();
      const result = await repairScript(claudeDir);

      if (result.success) {
        setMessage({ type: 'success', text: t('hooks.repairScriptSuccess') });
      } else {
        setMessage({ type: 'error', text: result.error || result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsRepairingScript(false);
      await checkInstallStatus();
    }
  };

  // 切换 hook 语言
  const handleSwitchLanguage = async (newLanguage: Language) => {
    setIsSwitchingLanguage(true);
    setMessage(null);

    try {
      const claudeDir = await getEffectiveClaudeDir();
      const result = await switchHookLanguage(newLanguage, claudeDir, (status) => {
        setPythonStatus(status);
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadConfig();
      } else {
        setMessage({ type: 'error', text: result.error || result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  // 重置配置
  const handleResetConfig = async () => {
    setIsResetting(true);
    setMessage(null);
    setShowResetDialog(false);

    try {
      await resetToDefaults();
      await saveConfig();
      setMessage({ type: 'success', text: t('hooks.resetSuccess') });
      await loadConfig();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsResetting(false);
    }
  };

  // 获取显示的目录路径
  const displayDir = workspacePath
    ? `${workspacePath.replace(/^\/Users\/[^/]+/, '~')}/.claude`
    : '~/.claude';

  // 状态判断
  const isPartial = hookStatus?.status === 'partial';
  const isModified = hookStatus?.status === 'modified';
  const isNotInstalled = hookStatus?.status === 'not_installed' || hookStatus === null;
  const hasScriptIssue = hookStatus?.scriptModified === true;

  // 是否正在执行任何修复
  const isAnyRepairing = isRepairingSettings || isRepairingScript;

  return (
    <>
      <PythonStatusCard
        status={pythonStatus}
        onClose={() => setPythonStatus(null)}
      />

      {isNotInstalled ? (
        // 未安装：显示安装卡片
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('hooks.title')}</CardTitle>
                <CardDescription>{t('hooks.description')}</CardDescription>
              </div>
              {isChecking ? (
                <Badge variant="outline">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {t('hooks.checking')}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  {t('hooks.notInstalled')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('hooks.whatIsThis')}</h4>
              <p className="text-sm text-muted-foreground">{t('hooks.explanation')}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('hooks.installedFiles')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {displayDir}/permissions.json</li>
                <li>• {displayDir}/hooks/unified-hook.py</li>
                <li>• {displayDir}/{settingsFileName} (hooks section)</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInstall} disabled={isLoading || isChecking} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('hooks.installing')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {t('hooks.install')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // 已安装：显示控件区
        <div className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Settings 问题：partial（缺事件） */}
          {isPartial && hookStatus && (
            <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{t('hooks.settingsBrokenTitle')}</span>
                    <span className="ml-2">{hookStatus.missingEvents.join(', ')}</span>
                  </div>
                  {autoRepairEnabled ? (
                    isRepairingSettings && <span className="text-xs">{t('hooks.repairingAuto')}</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRepairSettings}
                      disabled={isAnyRepairing || isLoading}
                      className="ml-4 gap-2 shrink-0"
                    >
                      {isRepairingSettings ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('hooks.repairing')}
                        </>
                      ) : (
                        <>
                          <Settings className="w-3 h-3" />
                          {t('hooks.repairSettings')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Settings 问题：modified（事件被改） */}
          {isModified && hookStatus && (
            <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{t('hooks.settingsModifiedTitle')}</span>
                    <span className="ml-2">{hookStatus.modifiedEvents.join(', ')}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepairSettings}
                    disabled={isAnyRepairing || isLoading}
                    className="ml-4 gap-2 shrink-0"
                  >
                    {isRepairingSettings ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t('hooks.repairing')}
                      </>
                    ) : (
                      <>
                        <Settings className="w-3 h-3" />
                        {t('hooks.repairSettings')}
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Script 问题：脚本内容与模板不同 */}
          {hasScriptIssue && (
            <Alert className="border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-400">
              <FileCode className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('hooks.scriptModifiedTitle')}</span>
                  {autoRepairEnabled ? (
                    isRepairingScript && <span className="text-xs">{t('hooks.repairingAuto')}</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRepairScript}
                      disabled={isAnyRepairing || isLoading}
                      className="ml-4 gap-2 shrink-0"
                    >
                      {isRepairingScript ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {t('hooks.repairing')}
                        </>
                      ) : (
                        <>
                          <FileCode className="w-3 h-3" />
                          {t('hooks.repairScript')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* 状态徽章：独立显示 Settings 和 Script 状态 */}
            {isModified ? (
              <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {t('hooks.settingsModifiedTitle')}
              </Badge>
            ) : isPartial ? (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {t('hooks.settingsBrokenTitle')}
              </Badge>
            ) : (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t('hooks.installed')}
              </Badge>
            )}

            {hasScriptIssue && (
              <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">
                <FileCode className="w-3 h-3 mr-1" />
                {t('hooks.scriptModifiedTitle')}
              </Badge>
            )}

            <Badge variant="outline">
              {installedLanguage === 'zh_CN' ? '中文' : 'English'}
            </Badge>

            {/* 自动修复开关 */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{t('hooks.autoRepair')}</span>
              <Switch
                checked={autoRepairEnabled}
                onCheckedChange={handleAutoRepairChange}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSwitchLanguage(installedLanguage === 'zh_CN' ? 'en_US' : 'zh_CN')}
              disabled={isSwitchingLanguage || isLoading || isAnyRepairing}
              className="gap-2"
            >
              {isSwitchingLanguage ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('hooks.switching')}
                </>
              ) : (
                <>
                  <Languages className="w-3 h-3" />
                  {t('hooks.switchTo')} {installedLanguage === 'zh_CN' ? 'English' : '中文'}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
              disabled={isResetting || isLoading || isAnyRepairing}
              className="gap-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('hooks.resetting')}
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3" />
                  {t('hooks.resetConfig')}
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowUninstallDialog(true)}
              disabled={isLoading || isChecking || isAnyRepairing}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('hooks.uninstalling')}
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  {t('hooks.uninstall')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showUninstallDialog} onOpenChange={setShowUninstallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hooks.uninstall')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hooks.confirmUninstall')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUninstall}>
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hooks.resetConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hooks.resetConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfig}>
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
