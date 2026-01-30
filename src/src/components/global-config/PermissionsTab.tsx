import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@/stores';
import { ModePermissionsCard } from './ModePermissionsCard';
import { cn } from '@/lib/utils';
import type { ModeName } from '@/types';

const modes: ModeName[] = ['plan', 'default', 'acceptEdits'];

const modeIcons: Record<ModeName, string> = {
  plan: '📋',
  default: '⚙️',
  acceptEdits: '✏️',
};

export function PermissionsTab() {
  const { t } = useTranslation();
  const { config, updateModePermission } = useConfigStore();
  const [selectedMode, setSelectedMode] = useState<ModeName>('plan');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t('modes.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('modes.description')}
        </p>
      </div>

      <div className="flex gap-4">
        {/* 左侧模式列表 */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                'flex items-center gap-2',
                selectedMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span>{modeIcons[mode]}</span>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{t(`modes.${mode}`)}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 右侧权限配置 */}
        <div className="flex-1 min-w-0">
          <ModePermissionsCard
            mode={selectedMode}
            permissions={config.modes[selectedMode]}
            onUpdate={(field, value) => updateModePermission(selectedMode, field, value)}
          />
        </div>
      </div>
    </div>
  );
}
