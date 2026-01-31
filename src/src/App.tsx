import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout';
import { MacOSPermissionDialog } from '@/components/layout/MacOSPermissionDialog';
import { GlobalConfigPanel } from '@/components/global-config';
import {
  useConfigStore,
  useWorkspaceStore,
  usePermissionStore,
  waitForHydration
} from '@/stores';
import { Loader2 } from 'lucide-react';

function App() {
  const { loadConfig, isLoading, config } = useConfigStore();
  const { setWorkspaceWithoutFileAccess } = useWorkspaceStore();
  const {
    permissionStatus,
    showPermissionDialog,
    checkPermission,
    setShowPermissionDialog,
    setHasConfirmedThisSession
  } = usePermissionStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // 切换到全局模式的处理函数
  const handleSwitchToGlobal = useCallback(async () => {
    // 清除工作目录，切换到全局模式（不访问文件系统）
    setWorkspaceWithoutFileAccess(null);
    // 标记本次会话已确认
    setHasConfirmedThisSession(true);
    // 关闭对话框
    setShowPermissionDialog(false);
    // 重新加载配置（此时 workspacePath 已经是 null，会使用 ~/.claude）
    await loadConfig();
  }, [setWorkspaceWithoutFileAccess, setHasConfirmedThisSession, setShowPermissionDialog, loadConfig]);

  // 用户确认已授权，继续加载
  const handleContinueWithPermission = useCallback(async () => {
    // 标记本次会话已确认
    setHasConfirmedThisSession(true);
    // 关闭对话框
    setShowPermissionDialog(false);
    // 继续加载配置
    await loadConfig();
  }, [setHasConfirmedThisSession, setShowPermissionDialog, loadConfig]);

  // 串行初始化流程：等待 hydration -> 检查权限 -> 加载配置
  useEffect(() => {
    const initializeApp = async () => {
      // 0. 等待 workspace store hydration 完成（恢复 workspacePath）
      await waitForHydration();

      // 1. 获取恢复后的 workspacePath
      const restoredWorkspacePath = useWorkspaceStore.getState().workspacePath;

      // DEBUG: 打印恢复的路径
      console.log('[App] Restored workspacePath:', restoredWorkspacePath);

      // 2. 检查权限（不会访问文件系统，仅检查是否需要显示引导）
      const canContinue = await checkPermission(restoredWorkspacePath);

      console.log('[App] Permission check result:', canContinue, 'permissionStatus:', usePermissionStore.getState().permissionStatus);

      // 3. 只有可以继续时才加载配置
      if (canContinue) {
        console.log('[App] Loading config...');
        await loadConfig();
      }
      // 如果需要引导，对话框会显示，等待用户选择

      setIsInitialized(true);
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在初始化时执行一次

  // 正在检查权限或未初始化时显示加载状态
  if (!isInitialized || permissionStatus === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 权限被拒绝时，只显示对话框
  if (permissionStatus === 'denied' && showPermissionDialog) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <MacOSPermissionDialog
          open={showPermissionDialog}
          onOpenChange={setShowPermissionDialog}
          onSwitchToGlobal={handleSwitchToGlobal}
          onContinueWithPermission={handleContinueWithPermission}
        />
      </div>
    );
  }

  // 配置加载中或未加载时显示加载状态
  if (isLoading || !config) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 overflow-auto p-6">
        <GlobalConfigPanel />
      </main>

      {/* 当用户关闭对话框后，仍可以通过其他方式重新触发显示 */}
      <MacOSPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onSwitchToGlobal={handleSwitchToGlobal}
        onContinueWithPermission={handleContinueWithPermission}
      />
    </div>
  );
}

export default App;
