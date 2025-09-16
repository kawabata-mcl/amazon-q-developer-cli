'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/hooks/use-settings';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' }
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
                className="w-full max-w-xs"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-xs">
                <span>10s</span>
                <span>5min</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Maximum Conversations: {general.maxConversationHistory}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Maximum number of conversations to keep in history
          </p>
          <Slider
            value={[general.maxConversationHistory]}
            onValueChange={([value]) => 
              updateSetting('general', { maxConversationHistory: value })
            }
            min={10}
            max={1000}
            step={10}
            className="w-full max-w-xs"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-xs">
            <span>10</span>
            <span>1000</span>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Choose your preferred language for the interface
          </p>
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Auto Save:</span>
            <span className={general.autoSave ? 'text-green-600' : 'text-red-600'}>
              {general.autoSave ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Max Conversations:</span>
            <span>{general.maxConversationHistory}</span>
          </div>
          <div className="flex justify-between">
            <span>Notifications:</span>
            <span className={general.enableNotifications ? 'text-green-600' : 'text-red-600'}>
              {general.enableNotifications ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}