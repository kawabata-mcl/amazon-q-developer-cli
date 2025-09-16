'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/use-settings';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useState } from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';

const SHORTCUT_DESCRIPTIONS = {
  'new-conversation': 'Start a new conversation',
  'toggle-sidebar': 'Show/hide the sidebar',
  'search': 'Search conversations',
  'settings': 'Open settings',
  'quit': 'Quit the application'
};

const DEFAULT_SHORTCUTS = {
  'new-conversation': 'Cmd+N',
  'toggle-sidebar': 'Cmd+B',
  'search': 'Cmd+F',
  'settings': 'Cmd+,',
  'quit': 'Cmd+Q'
};

export function KeyboardSettings() {
  const { settings, updateSetting } = useSettings();
  const { shortcuts: registeredShortcuts } = useKeyboardShortcuts({});
  const { keyboard } = settings;
  
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [tempShortcuts, setTempShortcuts] = useState(keyboard.shortcuts);

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

  const resetToDefaults = () => {
    setTempShortcuts(DEFAULT_SHORTCUTS);
    updateSetting('keyboard', { shortcuts: DEFAULT_SHORTCUTS });
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
        <h3 className="text-lg font-semibold mb-4">Global Shortcuts</h3>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
        
        <div className="space-y-3">
          {Object.entries(SHORTCUT_DESCRIPTIONS).map(([action, description]) => (
            <div
              key={action}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{description}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {action.replace('-', ' ')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {editingShortcut === action ? (
                  <ShortcutEditor
                    initialValue={tempShortcuts[action]}
                    onSave={(shortcut) => handleShortcutSave(action, shortcut)}
                    onCancel={handleShortcutCancel}
                  />
                ) : (
                  <>
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                      {formatShortcut(tempShortcuts[action])}
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