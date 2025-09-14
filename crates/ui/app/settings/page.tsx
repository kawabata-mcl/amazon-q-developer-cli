'use client';

import { useState, useEffect } from 'react';
import { getSettingsCommand, saveSettingsCommand } from '@/lib/tauri';
import type { AppSettings } from '@/types/common';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'chat' | 'window'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await getSettingsCommand();
      // Safely cast with validation
      const data = settingsData as Record<string, unknown>;
      const windowSettings = data?.windowSettings as Record<string, unknown> | undefined;
      const chatSettings = data?.chatSettings as Record<string, unknown> | undefined;
      
      const validatedSettings: AppSettings = {
        theme: (['light', 'dark', 'system'].includes(data?.theme as string) 
          ? (data?.theme as 'light' | 'dark' | 'system') 
          : 'system'),
        windowSettings: {
          width: (windowSettings?.width as number) || 1200,
          height: (windowSettings?.height as number) || 800,
          maximized: (windowSettings?.maximized as boolean) || false,
        },
        chatSettings: {
          autoSave: (chatSettings?.autoSave as boolean) ?? true,
          maxHistoryLength: (chatSettings?.maxHistoryLength as number) || 100,
        },
      };
      setSettings(validatedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Set default settings
      setSettings({
        theme: 'system',
        windowSettings: {
          width: 1200,
          height: 800,
          maximized: false,
        },
        chatSettings: {
          autoSave: true,
          maxHistoryLength: 100,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await saveSettingsCommand(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your Amazon Q Desktop settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => window.location.href = '/chat'}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'general'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Chat Settings
              </button>
              <button
                onClick={() => setActiveTab('window')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'window'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Window Settings
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    General Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings?.theme || 'system'}
                        onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">Follow System</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Chat Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings?.chatSettings.autoSave || false}
                          onChange={(e) => updateSettings({
                            chatSettings: {
                              ...settings!.chatSettings,
                              autoSave: e.target.checked,
                            }
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Auto-save conversations
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max History Length
                      </label>
                      <input
                        type="number"
                        value={settings?.chatSettings.maxHistoryLength || 100}
                        onChange={(e) => updateSettings({
                          chatSettings: {
                            ...settings!.chatSettings,
                            maxHistoryLength: parseInt(e.target.value),
                          }
                        })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="10"
                        max="1000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'window' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Window Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Width
                        </label>
                        <input
                          type="number"
                          value={settings?.windowSettings.width || 1200}
                          onChange={(e) => updateSettings({
                            windowSettings: {
                              ...settings!.windowSettings,
                              width: parseInt(e.target.value),
                            }
                          })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="800"
                          max="2560"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Height
                        </label>
                        <input
                          type="number"
                          value={settings?.windowSettings.height || 800}
                          onChange={(e) => updateSettings({
                            windowSettings: {
                              ...settings!.windowSettings,
                              height: parseInt(e.target.value),
                            }
                          })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          min="600"
                          max="1440"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings?.windowSettings.maximized || false}
                          onChange={(e) => updateSettings({
                            windowSettings: {
                              ...settings!.windowSettings,
                              maximized: e.target.checked,
                            }
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Maximize window on startup
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}