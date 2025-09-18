import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAppSettingsCommand, updateAppSettingsCommand, resetAppSettingsCommand } from '@/lib/tauri';
import type { AppSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  updateAppearanceSettings: (updates: Partial<AppSettings['appearance']>) => Promise<void>;
  updateWindowSettings: (updates: Partial<AppSettings['window']>) => Promise<void>;
  updateKeyboardSettings: (updates: Partial<AppSettings['keyboard']>) => Promise<void>;
  updateGeneralSettings: (updates: Partial<AppSettings['general']>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,

      loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await getAppSettingsCommand() as AppSettings;
          set({ settings, isLoading: false });
        } catch (error) {
          console.error('Failed to load settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load settings',
            isLoading: false 
          });
        }
      },

      updateSettings: async (updates: Partial<AppSettings>) => {
        const currentSettings = get().settings || DEFAULT_SETTINGS;
        const newSettings: AppSettings = {
          ...currentSettings,
          appearance: updates.appearance
            ? { ...currentSettings.appearance, ...updates.appearance }
            : currentSettings.appearance,
          window: updates.window
            ? { ...currentSettings.window, ...updates.window }
            : currentSettings.window,
          keyboard: updates.keyboard
            ? {
                ...currentSettings.keyboard,
                ...updates.keyboard,
                shortcuts: updates.keyboard.shortcuts
                  ? {
                      ...currentSettings.keyboard.shortcuts,
                      ...updates.keyboard.shortcuts,
                    }
                  : currentSettings.keyboard.shortcuts,
              }
            : currentSettings.keyboard,
          general: updates.general
            ? { ...currentSettings.general, ...updates.general }
            : currentSettings.general,
        };
        
        set({ isLoading: true, error: null });
        try {
          await updateAppSettingsCommand(newSettings);
          set({ settings: newSettings, isLoading: false });
        } catch (error) {
          console.error('Failed to update settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update settings',
            isLoading: false 
          });
        }
      },

      resetSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          await resetAppSettingsCommand();
          set({ settings: DEFAULT_SETTINGS, isLoading: false });
        } catch (error) {
          console.error('Failed to reset settings:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reset settings',
            isLoading: false 
          });
        }
      },

      updateAppearanceSettings: async (updates: Partial<AppSettings['appearance']>) => {
        const currentSettings = get().settings || DEFAULT_SETTINGS;
        const newSettings = {
          ...currentSettings,
          appearance: { ...currentSettings.appearance, ...updates }
        } as AppSettings;
        await get().updateSettings(newSettings);
      },

      updateWindowSettings: async (updates: Partial<AppSettings['window']>) => {
        const currentSettings = get().settings || DEFAULT_SETTINGS;
        const newSettings = {
          ...currentSettings,
          window: { ...currentSettings.window, ...updates }
        } as AppSettings;
        await get().updateSettings(newSettings);
      },

      updateKeyboardSettings: async (updates: Partial<AppSettings['keyboard']>) => {
        const currentSettings = get().settings || DEFAULT_SETTINGS;
        const newSettings = {
          ...currentSettings,
          keyboard: { ...currentSettings.keyboard, ...updates }
        } as AppSettings;
        await get().updateSettings(newSettings);
      },

      updateGeneralSettings: async (updates: Partial<AppSettings['general']>) => {
        const currentSettings = get().settings || DEFAULT_SETTINGS;
        const newSettings = {
          ...currentSettings,
          general: { ...currentSettings.general, ...updates }
        } as AppSettings;
        await get().updateSettings(newSettings);
      }
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);

export { DEFAULT_SETTINGS } from '@/types/settings'