import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui';

interface ToggleSwitchProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ value, onChange, disabled }: ToggleSwitchProps) {
  const { t } = useTranslation();

  // value > 0 表示启用（兼容 1 和 2）
  const isEnabled = value > 0;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted">
      <span className="text-xs font-medium text-muted-foreground">
        {isEnabled ? t('values.enabled') : t('values.disabled')}
      </span>
      <Switch
        checked={isEnabled}
        onCheckedChange={(checked: boolean) => onChange(checked ? 1 : 0)}
        disabled={disabled}
      />
    </div>
  );
}
