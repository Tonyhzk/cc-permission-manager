import { useTranslation } from 'react-i18next';
import { Settings, Globe, Save, RotateCcw, Sun, Moon, Monitor, Github } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useConfigStore, useThemeStore } from '@/stores';
import { open } from '@tauri-apps/plugin-shell';

export function Header() {
  const { t, i18n } = useTranslation();
  const { hasChanges, saveConfig, discardChanges, isSaving } = useConfigStore();
  const { theme, setTheme, setLanguage } = useThemeStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    // 保存语言偏好
    setLanguage(newLang as 'en' | 'zh');
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const openGithub = async () => {
    await open('https://github.com/Tonyhzk/cc-permission-manager');
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">{t('app.title')}</h1>
          {hasChanges && (
            <Badge variant="warning" className="text-xs">
              {t('messages.unsavedChanges')}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={openGithub}
            title="GitHub Repository"
          >
            <Github className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            title={`${t('theme.toggle')} (${t(`theme.${theme}`)})`}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle Language">
            <Globe className="h-4 w-4" />
          </Button>

          {hasChanges && (
            <>
              <Button variant="outline" size="sm" onClick={discardChanges}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('actions.discard')}
              </Button>
              <Button size="sm" onClick={saveConfig} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {t('actions.save')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
