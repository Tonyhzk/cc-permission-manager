import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { PermissionsTab } from './PermissionsTab';
import { CategoriesTab } from './CategoriesTab';
import { NotificationsTab } from './NotificationsTab';
import { GlobalHookInstaller } from './GlobalHookInstaller';
import { QuickActions } from './QuickActions';
import { WorkspaceSelector } from './WorkspaceSelector';

export function GlobalConfigPanel() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 工作目录选择器 */}
      <WorkspaceSelector />

      {/* 全局 Hooks 安装器 */}
      <GlobalHookInstaller />

      {/* 快捷操作按钮 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t('quickActions.title')}
        </h3>
        <QuickActions />
      </div>

      {/* 配置选项卡 */}
      <Tabs defaultValue="permissions" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">{t('tabs.permissions')}</TabsTrigger>
          <TabsTrigger value="categories">{t('tabs.categories')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-4">
          <TabsContent value="permissions" className="m-0">
            <PermissionsTab />
          </TabsContent>
          <TabsContent value="categories" className="m-0">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="notifications" className="m-0">
            <NotificationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
