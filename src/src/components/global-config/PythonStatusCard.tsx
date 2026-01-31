import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export type PythonStatus =
  | { type: 'success'; command: string }
  | { type: 'warning'; path: string; scriptsPath: string }
  | { type: 'error'; platform: string }
  | null;

interface PythonStatusCardProps {
  status: PythonStatus;
  onClose: () => void;
}

export function PythonStatusCard({ status, onClose }: PythonStatusCardProps) {
  const { t } = useTranslation();

  if (!status) return null;

  const getStatusConfig = () => {
    switch (status.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          variant: 'default' as const,
          title: t('python.success.title'),
          description: t('python.success.description', { command: status.command }),
          className: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'default' as const,
          title: t('python.warning.title'),
          description: (
            <>
              <p className="mb-2">{t('python.warning.foundInstallation')}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium mb-1">{t('python.warning.pythonDir')}</p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 select-text">
                    {status.path}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">{t('python.warning.scriptsDir')}</p>
                  <code className="block bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 select-text">
                    {status.scriptsPath}
                  </code>
                </div>
              </div>
              <p className="mt-2 text-sm">{t('python.warning.instruction')}</p>
            </>
          ),
          className: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          variant: 'destructive' as const,
          title: t('python.error.title'),
          description: getPlatformInstructions(status.platform),
          className: 'border-red-500/50',
        };
    }
  };

  const getPlatformInstructions = (platform: string): string => {
    switch (platform) {
      case 'windows':
        return t('python.error.windows');
      case 'macos':
        return t('python.error.macos');
      case 'linux':
        return t('python.error.linux');
      default:
        return t('python.error.title');
    }
  };

  const config = getStatusConfig();

  return (
    <Alert variant={config.variant} className={`relative ${config.className}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className="mt-2">
            {config.description}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-70 hover:opacity-100 absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('python.close')}</span>
        </Button>
      </div>
    </Alert>
  );
}
