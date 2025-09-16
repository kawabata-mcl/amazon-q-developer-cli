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

    expect(await screen.findByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Auto Save')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<SettingsPanel isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('switches tabs and renders corresponding content', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    // Appearance tab
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(await screen.findByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Color Theme')).toBeInTheDocument();

    // Window tab
    await userEvent.click(screen.getByRole('button', { name: 'Window' }));
    expect(await screen.findByText('Window Size')).toBeInTheDocument();
    expect(screen.getByText('Window Behavior')).toBeInTheDocument();

    // Keyboard tab
    await userEvent.click(screen.getByRole('button', { name: 'Keyboard' }));
    expect(await screen.findByText('Global Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Shortcut Format')).toBeInTheDocument();
  });

  test('updates a general setting via switch and reflects immediately', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    const autoSaveSwitch = await screen.findByRole('switch', { name: /enable auto save/i });
    // default is true
    expect(autoSaveSwitch).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(autoSaveSwitch);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i })).toHaveAttribute('aria-checked', 'false');
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
      expect(screen.getByRole('button', { name: 'Theme Select' })).toHaveTextContent('Dark');
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
      expect(screen.getByText(/Current: .*1300.*×.*900px/)).toBeInTheDocument();
    });
  });

  test('enables global shortcuts and shows warning', async () => {
    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Keyboard' }));

    const globalSwitch = await screen.findByRole('switch', { name: /enable global shortcuts/i });
    expect(globalSwitch).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(globalSwitch);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable global shortcuts/i })).toHaveAttribute('aria-checked', 'true');
    });

    expect(
      screen.getByText(/Global shortcuts may require accessibility permissions/i)
    ).toBeInTheDocument();
  });

  test('reset all settings restores defaults', async () => {
    // Mock confirm to accept
    const origConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);

    render(<SettingsPanel isOpen={true} onClose={jest.fn()} />);

    // First, change a setting (toggle auto save off)
    const autoSaveSwitch = await screen.findByRole('switch', { name: /enable auto save/i });
    await userEvent.click(autoSaveSwitch);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i })).toHaveAttribute('aria-checked', 'false');
    });

    // Click Reset All Settings in sidebar
    const resetAllBtn = screen.getByRole('button', { name: 'Reset All Settings' });
    await userEvent.click(resetAllBtn);

    // Defaults restored (autoSave true)
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /enable auto save/i })).toHaveAttribute('aria-checked', 'true');
    });

    window.confirm = origConfirm;
  });

  test('clicking Done calls onClose', async () => {
    const onClose = jest.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />);

    const doneButton = await screen.findByRole('button', { name: 'Done' });
    await userEvent.click(doneButton);

    expect(onClose).toHaveBeenCalled();
  });
});
