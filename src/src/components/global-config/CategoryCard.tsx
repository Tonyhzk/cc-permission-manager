import { useState, useEffect } from 'react';
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

  // Store raw text values for editing
  const [toolsText, setToolsText] = useState(config.tools.join('\n'));
  const [commandsText, setCommandsText] = useState(config.commands.join('\n'));

  // Update local state when config changes (e.g., switching categories)
  useEffect(() => {
    setToolsText(config.tools.join('\n'));
    setCommandsText(config.commands.join('\n'));
  }, [name]); // Only update when category changes

  const processLines = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleToolsBlur = () => {
    const tools = processLines(toolsText);
    onUpdateTools(tools);
  };

  const handleCommandsBlur = () => {
    const commands = processLines(commandsText);
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
            value={toolsText}
            onChange={(e) => setToolsText(e.target.value)}
            onBlur={handleToolsBlur}
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
            value={commandsText}
            onChange={(e) => setCommandsText(e.target.value)}
            onBlur={handleCommandsBlur}
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
