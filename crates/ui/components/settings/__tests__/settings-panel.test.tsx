import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { useSettingsStore } from '@/stores/settings-store';
import { DEFAULT_SETTINGS } from '@/types/settings';

// Ensure clean state for each test
beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS, isLoading: false, error: null });
});

describe('SettingsPanel', () => {
  test('renders when open and shows General tab by default', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    const heading = await screen.findByText('Settings');
    expect(heading).toBeTruthy();
    expect(screen.getByText('Auto Save')).toBeTruthy();
    expect(screen.getByLabelText('Enable Auto Save')).toBeTruthy();
  });

  test('does not render when closed', () => {
    render(<SettingsPanel isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Settings')).toBeNull();
  });

  test('switches tabs and renders corresponding content', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    // Appearance tab
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    const themeHeading = await screen.findByText('Theme');
    expect(themeHeading).toBeTruthy();
    expect(screen.getByText('Color Theme')).toBeTruthy();

    // Window tab
    await userEvent.click(screen.getByRole('button', { name: 'Window' }));
    const windowSizeHeading = await screen.findByText('Window Size');
    expect(windowSizeHeading).toBeTruthy();
    expect(screen.getByText('Window Behavior')).toBeTruthy();

    // Keyboard tab
    await userEvent.click(screen.getByRole('button', { name: 'Keyboard' }));
    const globalShortcutsHeading = await screen.findByText('Global Shortcuts');
    expect(globalShortcutsHeading).toBeTruthy();
    expect(screen.getByText('Shortcut Format')).toBeTruthy();
  });

  test('updates a general setting via switch and reflects immediately', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    const autoSaveSwitch = await screen.findByRole('switch', { name: /enable auto save/i });
    // default is true
    expect(autoSaveSwitch.getAttribute('aria-checked')).toBe('true');

    await userEvent.click(autoSaveSwitch);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i }).getAttribute('aria-checked')).toBe('false');
    });
  });

  test('changes theme in Appearance tab using Select', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));

    // Use aria-label to target the Theme select
    const themeSelectButton = await screen.findByRole('button', { name: 'Theme Select' });
    await userEvent.click(themeSelectButton);

    // Choose Dark
    const darkOption = await screen.findByRole('button', { name: 'Dark' });
    await userEvent.click(darkOption);

    // Now selected label updates to Dark
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Theme Select' }).textContent).toContain('Dark');
    });
  });

  test('applies window size changes and reflects in Current text', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Window' }));

    const widthInput = await screen.findByLabelText('Width');
    const heightInput = await screen.findByLabelText('Height');

    await act(async () => {
      fireEvent.change(widthInput, { target: { value: '1300' } });
      fireEvent.change(heightInput, { target: { value: '900' } });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Apply Size' }));

    await waitFor(() => {
      expect(screen.queryByText(/Current: .*1300.*×.*900px/)).not.toBeNull();
    });
  });

  test('enables global shortcuts and shows warning', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Keyboard' }));

    const globalSwitch = await screen.findByRole('switch', { name: /enable global shortcuts/i });
    expect(globalSwitch.getAttribute('aria-checked')).toBe('false');

    await userEvent.click(globalSwitch);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable global shortcuts/i }).getAttribute('aria-checked')).toBe('true');
    });

    expect(
      screen.queryByText(/Global shortcuts may require accessibility permissions/i)
    ).not.toBeNull();
  });

  test('reset all settings restores defaults', async () => {
    // Mock confirm to accept
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    // First, change a setting (toggle auto save off)
    const autoSaveSwitch = await screen.findByRole('switch', { name: /enable auto save/i });
    await userEvent.click(autoSaveSwitch);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i }).getAttribute('aria-checked')).toBe('false');
    });

    // Click Reset All Settings in sidebar
    const resetAllBtn = screen.getByRole('button', { name: 'Reset All Settings' });
    await userEvent.click(resetAllBtn);

    // Defaults restored (autoSave true)
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i }).getAttribute('aria-checked')).toBe('true');
    });

    confirmSpy.mockRestore();
  });

  test('clicking Done calls onClose', async () => {
    const onClose = jest.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />);

    const doneButton = await screen.findByRole('button', { name: 'Done' });
    await userEvent.click(doneButton);

    expect(onClose).toHaveBeenCalled();
  });
});
