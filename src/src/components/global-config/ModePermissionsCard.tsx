import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { PermissionSelector } from './PermissionSelector';
import { ToggleSwitch } from './ToggleSwitch';
import type { ModePermissions, ModeName } from '@/types';

interface ModePermissionsCardProps {
  mode: ModeName;
  permissions: ModePermissions;
  onUpdate: (field: keyof ModePermissions, value: number) => void;
}

const permissionFields: (keyof ModePermissions)[] = [
  'read',
  'readAllFiles',
  'edit',
  'editAllFiles',
  'risky',
  'riskyAllFiles',
  'useWeb',
  'useMcp',
  'allowUnknownCommand',
  'globalAllow',
  'globalDeny',
];

// 这些字段使用开关而不是权限选择器
const toggleFields: (keyof ModePermissions)[] = ['globalAllow', 'globalDeny'];

export function ModePermissionsCard({ mode, permissions, onUpdate }: ModePermissionsCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t(`modes.${mode}`)}</CardTitle>
        <CardDescription>{t(`modes.${mode}Desc`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionFields.map((field) => {
          const isToggle = toggleFields.includes(field);

          return (
            <div key={field} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t(`permissions.${field}`)}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {t(`permissions.${field}Desc`)}
                </div>
              </div>
              <div className="w-48 flex-shrink-0">
                {isToggle ? (
                  <ToggleSwitch
                    value={permissions[field]}
                    onChange={(value) => onUpdate(field, value)}
                  />
                ) : (
                  <PermissionSelector
                    value={permissions[field]}
                    onChange={(value) => onUpdate(field, value)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
