import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

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

  const effectiveSettings = settings ?? DEFAULT_SETTINGS;

  return {
    settings: effectiveSettings,
    isLoading,
    error,
    updateSettings,
    updateSetting,
    resetSettings,
    // Convenience getters
    theme: effectiveSettings.appearance.theme,
    fontSize: effectiveSettings.appearance.fontSize,
    fontFamily: effectiveSettings.appearance.fontFamily,
    shortcuts: effectiveSettings.keyboard.shortcuts,
    windowSettings: effectiveSettings.window,
    generalSettings: effectiveSettings.general
  };
}