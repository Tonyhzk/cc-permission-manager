import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from '@/components/ui';
import type { CategoryConfig, CategoryName } from '@/types';

interface CategoryCardProps {
  name: CategoryName;
  config: CategoryConfig;
  onUpdateTools: (tools: string[]) => void;
  onUpdateCommands: (commands: string[]) => void;
}

export function CategoryCard({
  name,
  config,
  onUpdateTools,
  onUpdateCommands,
}: CategoryCardProps) {
  const { t } = useTranslation();

  const handleToolsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const tools = e.target.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    onUpdateTools(tools);
  };

  const handleCommandsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const commands = e.target.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    onUpdateCommands(commands);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t(`categories.${name}`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tools */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('categories.tools')}</Label>
          <textarea
            value={config.tools.join('\n')}
            onChange={handleToolsChange}
            placeholder={t('categories.enterToolsPlaceholder')}
            className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            {t('categories.onePerLine')}
          </p>
        </div>

        {/* Commands */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('categories.commands')}</Label>
          <textarea
            value={config.commands.join('\n')}
            onChange={handleCommandsChange}
            placeholder={t('categories.enterCommandsPlaceholder')}
            className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y font-mono"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            {t('categories.onePerLine')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
