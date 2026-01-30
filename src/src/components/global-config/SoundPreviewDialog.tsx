import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Volume2, Play, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SoundPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sounds: string[];
  onSelectSound?: (sound: string) => void;
}

export function SoundPreviewDialog({
  open,
  onOpenChange,
  sounds,
  onSelectSound,
}: SoundPreviewDialogProps) {
  const { t } = useTranslation();
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const handlePlaySound = async (sound: string) => {
    setPlayingSound(sound);
    try {
      await invoke('play_sound', { soundName: sound });
      // Wait a bit for the sound to play
      setTimeout(() => {
        setPlayingSound(null);
      }, 1500);
    } catch (error) {
      console.error('Failed to play sound:', error);
      setPlayingSound(null);
    }
  };

  const handleSelectSound = (sound: string) => {
    if (onSelectSound) {
      onSelectSound(sound);
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            {t('notifications.soundPreview')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('notifications.soundPreviewDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-2 gap-2">
            {sounds.map((sound) => (
              <div
                key={sound}
                className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors"
              >
                <button
                  className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => handleSelectSound(sound)}
                >
                  {sound}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePlaySound(sound)}
                  disabled={playingSound !== null}
                >
                  {playingSound === sound ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.close')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
