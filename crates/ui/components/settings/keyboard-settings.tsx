'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/use-settings';
import { useKeyboardShortcuts, MACOS_STANDARD_SHORTCUTS, ACCESSIBILITY_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';
import { useState } from 'react';
import { Keyboard, RotateCcw, Eye, Volume2, ZoomIn, Accessibility } from 'lucide-react';

const SHORTCUT_DESCRIPTIONS = {
  // File operations
  'new-conversation': 'Start a new conversation',
  'open': 'Open file',
  'save': 'Save conversation',
  'quit': 'Quit the application',
  
  // Edit operations
  'copy': 'Copy selected text',
  'paste': 'Paste from clipboard',
  'cut': 'Cut selected text',
  'undo': 'Undo last action',
  'redo': 'Redo last action',
  'select-all': 'Select all text',
  'find': 'Find in conversation',
  
  // View operations
  'toggle-sidebar': 'Show/hide the sidebar',
  'search': 'Search conversations',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'actual-size': 'Reset zoom to 100%',
  'toggle-fullscreen': 'Toggle fullscreen mode',
  'refresh': 'Refresh the page',
  
  // Window operations
  'minimize': 'Minimize window',
  'close-window': 'Close window',
  'settings': 'Open settings',
};

const ACCESSIBILITY_DESCRIPTIONS = {
  'increase-font-size': 'Increase font size',
  'decrease-font-size': 'Decrease font size',
  'reset-font-size': 'Reset font size to default',
  'toggle-high-contrast': 'Toggle high contrast mode',
  'toggle-voice-over': 'Toggle VoiceOver support',
  'toggle-zoom': 'Toggle system zoom',
};

const SHORTCUT_CATEGORIES = {
  'File': ['new-conversation', 'open', 'save', 'quit'],
  'Edit': ['copy', 'paste', 'cut', 'undo', 'redo', 'select-all', 'find'],
  'View': ['toggle-sidebar', 'search', 'zoom-in', 'zoom-out', 'actual-size', 'toggle-fullscreen', 'refresh'],
  'Window': ['minimize', 'close-window', 'settings'],
};

export function KeyboardSettings() {
  const { settings, updateSetting } = useSettings();
  const { 
    shortcuts: registeredShortcuts, 
    resetToDefaults,
    isVoiceOverEnabled,
    enableAccessibilityShortcuts 
  } = useKeyboardShortcuts({});
  const { keyboard } = settings;
  
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [tempShortcuts, setTempShortcuts] = useState(keyboard.shortcuts);
  const [activeCategory, setActiveCategory] = useState<string>('File');

  const handleShortcutEdit = (action: string) => {
    setEditingShortcut(action);
  };

  const handleShortcutSave = (action: string, shortcut: string) => {
    const newShortcuts = { ...tempShortcuts, [action]: shortcut };
    setTempShortcuts(newShortcuts);
    updateSetting('keyboard', { shortcuts: newShortcuts });
    setEditingShortcut(null);
  };

  const handleShortcutCancel = () => {
    setTempShortcuts(keyboard.shortcuts);
    setEditingShortcut(null);
  };

  const handleResetToDefaults = () => {
    setTempShortcuts(MACOS_STANDARD_SHORTCUTS);
    resetToDefaults();
    setEditingShortcut(null);
  };

  const formatShortcut = (shortcut: string) => {
    return shortcut
      .replace('Cmd', '⌘')
      .replace('Ctrl', '⌃')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Global Shortcuts
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <label htmlFor="global-shortcuts" className="text-sm font-medium">
              Enable Global Shortcuts
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow shortcuts to work when the app is not focused
            </p>
          </div>
          <Switch
            id="global-shortcuts"
            checked={keyboard.enableGlobalShortcuts}
            onCheckedChange={(checked) => 
              updateSetting('keyboard', { enableGlobalShortcuts: checked })
            }
          />
        </div>
        
        {keyboard.enableGlobalShortcuts && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Global shortcuts may require accessibility permissions on macOS
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Accessibility className="h-5 w-5" />
          Accessibility
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="accessibility-shortcuts" className="text-sm font-medium">
                Enable Accessibility Shortcuts
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable shortcuts for accessibility features like font size and high contrast
              </p>
            </div>
            <Switch
              id="accessibility-shortcuts"
              checked={keyboard.enableAccessibilityShortcuts}
              onCheckedChange={(checked) => 
                updateSetting('keyboard', { enableAccessibilityShortcuts: checked })
              }
            />
          </div>

          {isVoiceOverEnabled && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  VoiceOver is enabled. Screen reader announcements are active.
                </p>
              </div>
            </div>
          )}

          {keyboard.enableAccessibilityShortcuts && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-3">Accessibility Shortcuts</h4>
              <div className="space-y-2">
                {Object.entries(ACCESSIBILITY_DESCRIPTIONS).map(([action, description]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm">{description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      {formatShortcut(ACCESSIBILITY_SHORTCUTS[action as keyof typeof ACCESSIBILITY_SHORTCUTS])}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">macOS Standard Shortcuts</h3>
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          {Object.keys(SHORTCUT_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === category
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="space-y-3">
          {SHORTCUT_CATEGORIES[activeCategory as keyof typeof SHORTCUT_CATEGORIES]?.map((action) => (
            <div
              key={action}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{SHORTCUT_DESCRIPTIONS[action as keyof typeof SHORTCUT_DESCRIPTIONS]}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {action.replace('-', ' ')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {editingShortcut === action ? (
                  <ShortcutEditor
                    initialValue={tempShortcuts[action] || MACOS_STANDARD_SHORTCUTS[action as keyof typeof MACOS_STANDARD_SHORTCUTS]}
                    onSave={(shortcut) => handleShortcutSave(action, shortcut)}
                    onCancel={handleShortcutCancel}
                  />
                ) : (
                  <>
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      {formatShortcut(tempShortcuts[action] || MACOS_STANDARD_SHORTCUTS[action as keyof typeof MACOS_STANDARD_SHORTCUTS])}
                    </kbd>
                    <Button
                      onClick={() => handleShortcutEdit(action)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Shortcut Format</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Use standard macOS modifier keys:</span>
          </div>
          <ul className="ml-6 space-y-1">
            <li><kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Cmd</kbd> for Command (⌘)</li>
            <li><kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> for Control (⌃)</li>
            <li><kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Alt</kbd> for Option (⌥)</li>
            <li><kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Shift</kbd> for Shift (⇧)</li>
          </ul>
          <p className="mt-2">
            Example: <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Cmd+Shift+N</kbd>
          </p>
        </div>
      </Card>
    </div>
  );
}

interface ShortcutEditorProps {
  initialValue: string;
  onSave: (shortcut: string) => void;
  onCancel: () => void;
}

function ShortcutEditor({ initialValue, onSave, onCancel }: ShortcutEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    event.preventDefault();
    
    const modifiers = [];
    if (event.metaKey) modifiers.push('Cmd');
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    
    const key = event.key;
    if (key !== 'Meta' && key !== 'Control' && key !== 'Alt' && key !== 'Shift') {
      const shortcut = [...modifiers, key.toUpperCase()].join('+');
      setValue(shortcut);
      setIsRecording(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setValue('Press keys...');
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-32 text-xs font-mono"
        placeholder="Cmd+Key"
      />
      <Button
        onClick={startRecording}
        variant="outline"
        size="sm"
        disabled={isRecording}
      >
        {isRecording ? 'Recording...' : 'Record'}
      </Button>
      <Button
        onClick={() => onSave(value)}
        size="sm"
        disabled={!value || value === 'Press keys...' || isRecording}
      >
        Save
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
      >
        Cancel
      </Button>
    </div>
  );
}