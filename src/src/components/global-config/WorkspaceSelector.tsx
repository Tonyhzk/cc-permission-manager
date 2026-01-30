import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderOpen, Home, X, ChevronDown, RefreshCw } from 'lucide-react';
import { useWorkspaceStore, useConfigStore } from '@/stores';
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
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

export function WorkspaceSelector() {
  const { t } = useTranslation();
  const {
    workspacePath,
    recentWorkspaces,
    isLoading,
    setWorkspace,
    removeRecentWorkspace,
  } = useWorkspaceStore();
  const { loadConfig } = useConfigStore();

  const [showRecent, setShowRecent] = useState(false);
  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('workspace.selectFolder'),
      });

      if (selected && typeof selected === 'string') {
        setConfirmSwitch(selected);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleSwitchWorkspace = async (path: string | null) => {
    setSwitching(true);
    try {
      await setWorkspace(path);
      await loadConfig();
      setConfirmSwitch(null);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchToGlobal = () => {
    setConfirmSwitch('__GLOBAL__');
  };

  const handleConfirmSwitch = async () => {
    if (confirmSwitch === '__GLOBAL__') {
      await handleSwitchWorkspace(null);
    } else if (confirmSwitch) {
      await handleSwitchWorkspace(confirmSwitch);
    }
  };

  const displayPath = workspacePath
    ? workspacePath.replace(/^\/Users\/[^/]+/, '~')
    : t('workspace.global');

  return (
    <>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                {t('workspace.current')}:
              </span>
              <Badge variant={workspacePath ? 'default' : 'secondary'} className="truncate max-w-[300px]">
                {workspacePath ? (
                  <FolderOpen className="h-3 w-3 mr-1 shrink-0" />
                ) : (
                  <Home className="h-3 w-3 mr-1 shrink-0" />
                )}
                <span className="truncate">{displayPath}</span>
              </Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {workspacePath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToGlobal}
                  disabled={isLoading || switching}
                >
                  <Home className="h-4 w-4 mr-1" />
                  {t('workspace.backToGlobal')}
                </Button>
              )}

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecent(!showRecent)}
                  disabled={recentWorkspaces.length === 0}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('workspace.recent')}
                </Button>

                {showRecent && recentWorkspaces.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-lg z-50">
                    <div className="p-2 max-h-60 overflow-y-auto">
                      {recentWorkspaces.map((path) => (
                        <div
                          key={path}
                          className="flex items-center justify-between gap-2 p-2 hover:bg-accent rounded-md group"
                        >
                          <button
                            className="flex-1 text-left text-sm truncate"
                            onClick={() => {
                              setShowRecent(false);
                              setConfirmSwitch(path);
                            }}
                            title={path}
                          >
                            {path.replace(/^\/Users\/[^/]+/, '~')}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentWorkspace(path);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleSelectFolder}
                disabled={isLoading || switching}
              >
                {switching ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4 mr-1" />
                )}
                {t('workspace.select')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 点击外部关闭最近列表 */}
      {showRecent && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRecent(false)}
        />
      )}

      {/* 确认切换对话框 */}
      <AlertDialog open={!!confirmSwitch} onOpenChange={() => setConfirmSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.confirmSwitch')}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmSwitch === '__GLOBAL__'
                ? t('workspace.confirmSwitchToGlobal')
                : t('workspace.confirmSwitchTo', {
                    path: confirmSwitch?.replace(/^\/Users\/[^/]+/, '~'),
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={switching}>
              {t('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch} disabled={switching}>
              {switching ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              {t('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
