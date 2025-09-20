import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
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
          const settings = await invoke<AppSettings>('get_app_settings');
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
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...updates };
        
        set({ isLoading: true, error: null });
        try {
          await invoke('update_app_settings', { settings: newSettings });
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
          await invoke('reset_app_settings');
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
        const currentSettings = get().settings;
        const newSettings = {
          ...currentSettings,
          appearance: { ...currentSettings.appearance, ...updates }
        };
        await get().updateSettings(newSettings);
      },

      updateWindowSettings: async (updates: Partial<AppSettings['window']>) => {
        const currentSettings = get().settings;
        const newSettings = {
          ...currentSettings,
          window: { ...currentSettings.window, ...updates }
        };
        await get().updateSettings(newSettings);
      },

      updateKeyboardSettings: async (updates: Partial<AppSettings['keyboard']>) => {
        const currentSettings = get().settings;
        const newSettings = {
          ...currentSettings,
          keyboard: { ...currentSettings.keyboard, ...updates }
        };
        await get().updateSettings(newSettings);
      },

      updateGeneralSettings: async (updates: Partial<AppSettings['general']>) => {
        const currentSettings = get().settings;
        const newSettings = {
          ...currentSettings,
          general: { ...currentSettings.general, ...updates }
        };
        await get().updateSettings(newSettings);
      }
    }),
    {
      name: 'settings-store',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);