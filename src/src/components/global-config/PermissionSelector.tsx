import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PermissionSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PermissionSelector({ value, onChange, disabled }: PermissionSelectorProps) {
  const { t } = useTranslation();

  // 0=询问，1=允许
  const options = [
    { value: 0, label: t('values.ask'), color: 'bg-yellow-500' },
    { value: 1, label: t('values.allow'), color: 'bg-green-500' },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
            value === option.value
              ? `${option.color} text-white shadow-sm`
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
