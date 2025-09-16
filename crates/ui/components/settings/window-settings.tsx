'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { useState } from 'react';

export function WindowSettings() {
  const { settings, updateSetting } = useSettings();
  const { window: windowSettings } = settings;
  
  const [tempWidth, setTempWidth] = useState(windowSettings.width.toString());
  const [tempHeight, setTempHeight] = useState(windowSettings.height.toString());

  const handleSizeUpdate = () => {
    const width = parseInt(tempWidth, 10);
    const height = parseInt(tempHeight, 10);
    
    if (width >= 400 && height >= 300) {
      updateSetting('window', { width, height });
    }
  };

  const resetToDefaults = () => {
    updateSetting('window', {
      width: 1200,
      height: 800,
      maximized: false,
      alwaysOnTop: false,
      rememberPosition: true
    });
    setTempWidth('1200');
    setTempHeight('800');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Window Size</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="window-width">
                Width
              </label>
              <Input
                id="window-width"
                type="number"
                value={tempWidth}
                onChange={(e) => setTempWidth(e.target.value)}
                min="400"
                max="3840"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="window-height">
                Height
              </label>
              <Input
                id="window-height"
                type="number"
                value={tempHeight}
                onChange={(e) => setTempHeight(e.target.value)}
                min="300"
                max="2160"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSizeUpdate}
              size="sm"
              disabled={
                parseInt(tempWidth, 10) < 400 || 
                parseInt(tempHeight, 10) < 300 ||
                (parseInt(tempWidth, 10) === windowSettings.width && 
                 parseInt(tempHeight, 10) === windowSettings.height)
              }
            >
              Apply Size
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
            >
              Reset to Default
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current: {windowSettings.width} × {windowSettings.height}px
            <br />
            Minimum: 400 × 300px
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Window Behavior</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="maximized" className="text-sm font-medium">
                Start Maximized
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Open the application in maximized state
              </p>
            </div>
            <Switch
              id="maximized"
              checked={windowSettings.maximized}
              onCheckedChange={(checked) => 
                updateSetting('window', { maximized: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="always-on-top" className="text-sm font-medium">
                Always on Top
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep the window above other applications
              </p>
            </div>
            <Switch
              id="always-on-top"
              checked={windowSettings.alwaysOnTop}
              onCheckedChange={(checked) => 
                updateSetting('window', { alwaysOnTop: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="remember-position" className="text-sm font-medium">
                Remember Position
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Restore window position when reopening
              </p>
            </div>
            <Switch
              id="remember-position"
              checked={windowSettings.rememberPosition}
              onCheckedChange={(checked) => 
                updateSetting('window', { rememberPosition: checked })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Position</h3>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">X Position:</span> {windowSettings.x ?? 'Center'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Y Position:</span> {windowSettings.y ?? 'Center'}
          </div>
          <div className="text-sm">
            <span className="font-medium">Maximized:</span> {windowSettings.maximized ? 'Yes' : 'No'}
          </div>
        </div>
      </Card>
    </div>
  );
}