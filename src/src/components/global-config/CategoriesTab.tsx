import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@/stores';
import { CategoryCard } from './CategoryCard';
import { cn } from '@/lib/utils';
import type { CategoryName } from '@/types';

const categories: CategoryName[] = [
  'read',
  'edit',
  'risky',
  'useWeb',
  'useMcp',
  'globalAllow',
  'globalDeny',
];

const categoryIcons: Record<CategoryName, string> = {
  read: '📖',
  edit: '✏️',
  risky: '⚠️',
  useWeb: '🌐',
  useMcp: '🔌',
  globalAllow: '✅',
  globalDeny: '❌',
};

export function CategoriesTab() {
  const { t } = useTranslation();
  const { config, updateCategoryItems } = useConfigStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('read');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t('categories.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('categories.description')}
        </p>
      </div>

      <div className="flex gap-4">
        {/* 左侧分类列表 */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                'flex items-center gap-2',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span>{categoryIcons[category]}</span>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{t(`categories.${category}`)}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 右侧分类配置 */}
        <div className="flex-1 min-w-0">
          <CategoryCard
            name={selectedCategory}
            config={config.categories[selectedCategory]}
            onUpdateTools={(tools) => updateCategoryItems(selectedCategory, 'tools', tools)}
            onUpdateCommands={(commands) => updateCategoryItems(selectedCategory, 'commands', commands)}
          />
        </div>
      </div>
    </div>
  );
}
