import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { AlertTriangle, ExternalLink, FolderSync, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui';

interface MacOSPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToGlobal?: () => void;
  onContinueWithPermission?: () => void;
}

export function MacOSPermissionDialog({
  open,
  onOpenChange,
  onSwitchToGlobal,
  onContinueWithPermission
}: MacOSPermissionDialogProps) {
  const { t } = useTranslation();

  const handleOpenSettings = async () => {
    try {
      await invoke('open_macos_full_disk_access');
      // Keep dialog open so user can see the instructions
    } catch (error) {
      console.error('Failed to open system preferences:', error);
    }
  };

  const handleSwitchToGlobal = () => {
    if (onSwitchToGlobal) {
      onSwitchToGlobal();
    } else {
      onOpenChange(false);
    }
  };

  const handleContinueWithPermission = () => {
    if (onContinueWithPermission) {
      onContinueWithPermission();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t('permission.macOS.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>{t('permission.macOS.description')}</p>

            <div className="bg-muted p-4 rounded-md space-y-3">
              <p className="font-medium text-foreground">{t('permission.macOS.stepsTitle')}</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>{t('permission.macOS.step1')}</li>
                <li>{t('permission.macOS.step2')}</li>
                <li>{t('permission.macOS.step3')}</li>
                <li>{t('permission.macOS.step4')}</li>
              </ol>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('permission.macOS.note')}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSwitchToGlobal} className="gap-2">
            <FolderSync className="h-4 w-4" />
            {t('permission.macOS.switchToGlobal')}
          </Button>
          <Button variant="outline" onClick={handleOpenSettings} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t('permission.macOS.openSettings')}
          </Button>
          <Button onClick={handleContinueWithPermission} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('permission.macOS.alreadyGranted')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
