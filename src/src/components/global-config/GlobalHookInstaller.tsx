import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  isHooksInstalled,
  getInstalledHookLanguage,
  switchHookLanguage,
  isGlobalDir,
  type Language,
} from '@/lib/global-hook-installer';
import { useConfigStore, useWorkspaceStore } from '@/stores';
import { CheckCircle2, XCircle, Download, Trash2, Loader2, Languages } from 'lucide-react';
import { PythonStatusCard, type PythonStatus } from './PythonStatusCard';

export function GlobalHookInstaller() {
  const { t, i18n } = useTranslation();
  const { loadConfig } = useConfigStore();
  const { workspacePath, getEffectiveClaudeDir } = useWorkspaceStore();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [installedLanguage, setInstalledLanguage] = useState<Language | null>(null);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [settingsFileName, setSettingsFileName] = useState('settings.json');
  const [pythonStatus, setPythonStatus] = useState<PythonStatus>(null);

  // 检查安装状态
  const checkInstallStatus = async () => {
    setIsChecking(true);
    try {
      const claudeDir = await getEffectiveClaudeDir();
      const installed = await isHooksInstalled(claudeDir);
      setIsInstalled(installed);

      // 判断 settings 文件名
      const isGlobal = await isGlobalDir(claudeDir);
      setSettingsFileName(isGlobal ? 'settings.json' : 'settings.local.json');

      // 如果已安装，获取当前语言
      if (installed) {
        const language = await getInstalledHookLanguage(claudeDir);
        console.log('Installed language:', language);
        setInstalledLanguage(language);
      } else {
        setInstalledLanguage(null);
      }
    } catch (error) {
      console.error('Failed to check install status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkInstallStatus();
  }, [workspacePath]); // 当工作目录变化时重新检查

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
        setIsInstalled(true);
        setInstalledLanguage(language as Language);
        // 重新加载配置
        await loadConfig();
      } else {
        setMessage({
          type: 'error',
          text: result.error || result.message,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
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
        setIsInstalled(false);
        setInstalledLanguage(null);
      } else {
        setMessage({
          type: 'error',
          text: result.error || result.message,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
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
        setInstalledLanguage(newLanguage);
        // 重新加载配置以同步通知等设置
        await loadConfig();
      } else {
        setMessage({
          type: 'error',
          text: result.error || result.message,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSwitchingLanguage(false);
    }
  };

  // 获取显示的目录路径
  const displayDir = workspacePath
    ? `${workspacePath.replace(/^\/Users\/[^/]+/, '~')}/.claude`
    : '~/.claude';

  return (
    <>
      {/* Python 状态卡片 */}
      <PythonStatusCard
        status={pythonStatus}
        onClose={() => setPythonStatus(null)}
      />

      {!isInstalled ? (
        // 未安装时显示卡片
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
              <p className="text-sm text-muted-foreground">
                {t('hooks.explanation')}
              </p>
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
              <Button
                onClick={handleInstall}
                disabled={isLoading || isChecking}
                className="flex-1"
              >
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
        // 已安装时显示按钮组
        <div className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {/* 状态徽章 */}
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('hooks.installed')}
            </Badge>

            {/* 当前语言 */}
            <Badge variant="outline">
              {(installedLanguage || 'zh_CN') === 'zh_CN' ? '中文' : 'English'}
            </Badge>

            {/* 切换语言按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSwitchLanguage((installedLanguage || 'zh_CN') === 'zh_CN' ? 'en_US' : 'zh_CN')}
              disabled={isSwitchingLanguage || isLoading}
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
                  {t('hooks.switchTo')} {(installedLanguage || 'zh_CN') === 'zh_CN' ? 'English' : '中文'}
                </>
              )}
            </Button>

            {/* 卸载按钮 */}
            <Button
              onClick={() => setShowUninstallDialog(true)}
              disabled={isLoading || isChecking}
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
    </>
  );
}
