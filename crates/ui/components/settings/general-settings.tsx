'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { useSettings } from '@/hooks/use-settings';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' }
];

export function GeneralSettings() {
  const { settings, updateSetting } = useSettings();
  const { general } = settings;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Auto Save</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="auto-save" className="text-sm font-medium">
                Enable Auto Save
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically save conversations and settings
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={general.autoSave}
              onCheckedChange={(checked) => 
                updateSetting('general', { autoSave: checked })
              }
            />
          </div>

          {general.autoSave && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Auto Save Interval: {general.autoSaveInterval} seconds
              </label>
              <Slider
                value={[general.autoSaveInterval]}
                onValueChange={([value]) => 
                  updateSetting('general', { autoSaveInterval: value })
                }
                min={10}
                max={300}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10s</span>
                <span>5min</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Maximum Conversations: {general.maxConversationHistory}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Older conversations will be automatically archived
            </p>
            <Slider
              value={[general.maxConversationHistory]}
              onValueChange={([value]) => 
                updateSetting('general', { maxConversationHistory: value })
              }
              min={10}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span>
              <span>1000</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="notifications" className="text-sm font-medium">
              Enable Notifications
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show system notifications for important events
            </p>
          </div>
          <Switch
            id="notifications"
            checked={general.enableNotifications}
            onCheckedChange={(checked) => 
              updateSetting('general', { enableNotifications: checked })
            }
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Language</h3>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Interface Language
          </label>
          <Select
            value={general.language}
            onValueChange={(value) => 
              updateSetting('general', { language: value })
            }
            options={LANGUAGE_OPTIONS}
            className="w-full max-w-xs"
          />
        </div>
      </Card>
    </div>
  );
}