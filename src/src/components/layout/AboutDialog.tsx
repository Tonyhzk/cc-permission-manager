import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui';
import { Settings } from 'lucide-react';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
}

export function AboutDialog({ open, onOpenChange, version }: AboutDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <DialogTitle>{t('app.title')}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">v{version}</p>
            </div>
          </div>
          <DialogDescription className="text-left">
            {t('app.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.author')}</h4>
            <p className="text-sm text-muted-foreground">Tonyhzk</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.license')}</h4>
            <p className="text-sm text-muted-foreground">MIT</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.repository')}</h4>
            <a
              href="https://github.com/Tonyhzk/cc-permission-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline block"
            >
              github.com/Tonyhzk/cc-permission-manager
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.techStack')}</h4>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">React</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">TypeScript</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Tauri</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Tailwind CSS</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Vite</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Rust</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.thanks')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('about.thanksTo')}{' '}
              <a
                href="https://github.com/farion1231/cc-switch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                CC Switch
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('about.specialThanks')}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <a
                  href="https://github.com/anthropics/anthropic-quickstarts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Claude Code
                </a>
                {' '}- {t('about.claudeCodeDesc')}
              </div>
              <div>
                <a
                  href="https://github.com/cline/cline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Cline
                </a>
                {' '}- {t('about.clineDesc')}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {t('about.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}