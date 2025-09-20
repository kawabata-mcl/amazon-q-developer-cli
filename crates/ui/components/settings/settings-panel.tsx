'use client';

import { useState } from 'react';
import { X, Settings, Palette, Monitor, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GeneralSettings } from './general-settings';
import { AppearanceSettings } from './appearance-settings';
import { WindowSettings } from './window-settings';
import { KeyboardSettings } from './keyboard-settings';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'window', label: 'Window', icon: Monitor },
  { id: 'keyboard', label: 'Keyboard', icon: Keyboard }
] as const;

type TabId = typeof TABS[number]['id'];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { isLoading, error, resetSettings } = useSettings();

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'window':
        return <WindowSettings />;
      case 'keyboard':
        return <KeyboardSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Are you sure you want to reset all settings to their defaults? This action cannot be undone.')) {
      await resetSettings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleResetAll}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isLoading}
              >
                Reset All Settings
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Error: {error}
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Loading settings...
                  </p>
                </div>
              )}

              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Settings are automatically saved
          </div>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}