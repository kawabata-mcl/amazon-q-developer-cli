import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import type { AppSettings } from '@/types/settings';

export function useSettings() {
  const {
    settings,
    isLoading,
    error,
    loadSettings,
    updateSettings,
    resetSettings,
    updateAppearanceSettings,
    updateWindowSettings,
    updateKeyboardSettings,
    updateGeneralSettings
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ) => {
    switch (category) {
      case 'appearance':
        await updateAppearanceSettings(updates as Partial<AppSettings['appearance']>);
        break;
      case 'window':
        await updateWindowSettings(updates as Partial<AppSettings['window']>);
        break;
      case 'keyboard':
        await updateKeyboardSettings(updates as Partial<AppSettings['keyboard']>);
        break;
      case 'general':
        await updateGeneralSettings(updates as Partial<AppSettings['general']>);
        break;
      default:
        throw new Error(`Unknown settings category: ${category}`);
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSetting,
    resetSettings,
    // Convenience getters
    theme: settings.appearance.theme,
    fontSize: settings.appearance.fontSize,
    fontFamily: settings.appearance.fontFamily,
    shortcuts: settings.keyboard.shortcuts,
    windowSettings: settings.window,
    generalSettings: settings.general
  };
}