'use client';

import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/hooks/use-settings';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
];

const FONT_FAMILY_OPTIONS = [
  { value: 'system-ui', label: 'System Default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'SF Pro Display', label: 'SF Pro Display' },
  { value: 'Helvetica Neue', label: 'Helvetica Neue' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Monaco', label: 'Monaco (Monospace)' },
  { value: 'Menlo', label: 'Menlo (Monospace)' }
];

const ACCENT_COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
  { value: '#10b981', label: 'Green', color: '#10b981' },
  { value: '#f59e0b', label: 'Orange', color: '#f59e0b' },
  { value: '#ef4444', label: 'Red', color: '#ef4444' },
  { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },
  { value: '#06b6d4', label: 'Cyan', color: '#06b6d4' }
];

export function AppearanceSettings() {
  const { settings, updateSetting } = useSettings();
  const { appearance } = settings;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Color Theme
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Choose your preferred color theme
          </p>
          <Select
            aria-label="Theme Select"
            value={appearance.theme}
            onValueChange={(value) => 
              updateSetting('appearance', { theme: value as 'light' | 'dark' | 'system' })
            }
            options={THEME_OPTIONS}
            className="w-full max-w-xs"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Typography</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Font Family
            </label>
            <Select
              value={appearance.fontFamily}
              onValueChange={(value) => 
                updateSetting('appearance', { fontFamily: value })
              }
              options={FONT_FAMILY_OPTIONS}
              className="w-full max-w-xs"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Font Size: {appearance.fontSize}px
            </label>
            <Slider
              value={[appearance.fontSize]}
              onValueChange={([value]) => 
                updateSetting('appearance', { fontSize: value })
              }
              min={10}
              max={24}
              step={1}
              className="w-full max-w-xs"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-xs">
              <span>10px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
        <div>
          <label className="text-sm font-medium mb-2 block">
            Choose Accent Color
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            This color will be used for buttons, links, and highlights
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting('appearance', { accentColor: option.value })}
                className={`
                  flex items-center justify-center p-3 rounded-lg border-2 transition-all
                  ${appearance.accentColor === option.value 
                    ? 'border-gray-900 dark:border-white' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Selected: {ACCENT_COLOR_OPTIONS.find(opt => opt.value === appearance.accentColor)?.label}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div 
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-600"
          style={{ 
            fontFamily: appearance.fontFamily,
            fontSize: `${appearance.fontSize}px`
          }}
        >
          <h4 className="font-semibold mb-2">Sample Text</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            This is how your text will appear with the current settings.
          </p>
          <button
            className="px-4 py-2 rounded-md text-white font-medium"
            style={{ backgroundColor: appearance.accentColor }}
          >
            Sample Button
          </button>
        </div>
      </Card>
    </div>
  );
}