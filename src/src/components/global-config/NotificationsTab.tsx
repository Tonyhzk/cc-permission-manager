import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Volume2 } from 'lucide-react';
import { useConfigStore } from '@/stores';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from '@/components/ui';
import { SoundPreviewDialog } from './SoundPreviewDialog';

export function NotificationsTab() {
  const { t } = useTranslation();
  const { config, updateNotificationSetting } = useConfigStore();
  const { notifications } = config;
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentSoundTarget, setCurrentSoundTarget] = useState<'onCompletion' | 'onPermissionRequest' | null>(null);

  const soundOptions = notifications._soundOptions?.macOS || [
    'default',
    'Basso',
    'Blow',
    'Bottle',
    'Frog',
    'Funk',
    'Glass',
    'Hero',
    'Morse',
    'Ping',
    'Pop',
    'Purr',
    'Sosumi',
    'Submarine',
    'Tink',
  ];

  const handleSoundChange = async (value: string, target: 'onCompletion' | 'onPermissionRequest') => {
    updateNotificationSetting(`${target}.sound`, value);
    // Play sound preview when selecting
    try {
      await invoke('play_sound', { soundName: value });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const handleOpenPreviewDialog = (target: 'onCompletion' | 'onPermissionRequest') => {
    setCurrentSoundTarget(target);
    setPreviewDialogOpen(true);
  };

  const handleSelectSoundFromDialog = (sound: string) => {
    if (currentSoundTarget) {
      updateNotificationSetting(`${currentSoundTarget}.sound`, sound);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('notifications.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('notifications.description')}
        </p>
      </div>

      {/* Global Enable */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{t('notifications.enabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notifications.enabledDesc')}
              </p>
            </div>
            <Switch
              checked={notifications.enabled === 1}
              onCheckedChange={(checked: boolean) =>
                updateNotificationSetting('enabled', checked ? 1 : 0)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('notifications.onCompletion')}</CardTitle>
              <CardDescription>{t('notifications.onCompletionDesc')}</CardDescription>
            </div>
            <Switch
              checked={notifications.onCompletion.enabled === 1}
              onCheckedChange={(checked: boolean) =>
                updateNotificationSetting('onCompletion.enabled', checked ? 1 : 0)
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('notifications.notificationTitle')}</Label>
            <Input
              value={notifications.onCompletion.title}
              onChange={(e) =>
                updateNotificationSetting('onCompletion.title', e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('notifications.message')}</Label>
            <Input
              value={notifications.onCompletion.message}
              onChange={(e) =>
                updateNotificationSetting('onCompletion.message', e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('notifications.sound')}</Label>
            <div className="flex gap-2">
              <Select
                value={notifications.onCompletion.sound}
                onValueChange={(value) => handleSoundChange(value, 'onCompletion')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('notifications.selectSound')} />
                </SelectTrigger>
                <SelectContent>
                  {soundOptions.map((sound) => (
                    <SelectItem key={sound} value={sound}>
                      {sound}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenPreviewDialog('onCompletion')}
                title={t('notifications.previewAll')}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Request */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('notifications.onPermissionRequest')}</CardTitle>
              <CardDescription>{t('notifications.onPermissionRequestDesc')}</CardDescription>
            </div>
            <Switch
              checked={notifications.onPermissionRequest.enabled === 1}
              onCheckedChange={(checked: boolean) =>
                updateNotificationSetting('onPermissionRequest.enabled', checked ? 1 : 0)
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('notifications.notificationTitle')}</Label>
            <Input
              value={notifications.onPermissionRequest.title}
              onChange={(e) =>
                updateNotificationSetting('onPermissionRequest.title', e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('notifications.message')}</Label>
            <Input
              value={notifications.onPermissionRequest.message}
              onChange={(e) =>
                updateNotificationSetting('onPermissionRequest.message', e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t('notifications.sound')}</Label>
            <div className="flex gap-2">
              <Select
                value={notifications.onPermissionRequest.sound}
                onValueChange={(value) => handleSoundChange(value, 'onPermissionRequest')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('notifications.selectSound')} />
                </SelectTrigger>
                <SelectContent>
                  {soundOptions.map((sound) => (
                    <SelectItem key={sound} value={sound}>
                      {sound}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleOpenPreviewDialog('onPermissionRequest')}
                title={t('notifications.previewAll')}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sound Preview Dialog */}
      <SoundPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        sounds={soundOptions}
        onSelectSound={handleSelectSoundFromDialog}
      />
    </div>
  );
}
