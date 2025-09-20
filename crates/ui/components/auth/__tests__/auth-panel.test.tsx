import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthPanel } from '../auth-panel';
import { useAuthStore } from '../../../stores/auth-store';

describe('AuthPanel', () => {
	beforeEach(() => {
		useAuthStore.setState({
			status: { type: 'NotAuthenticated' } as any,
			isLoading: false,
			error: null,
			login: jest.fn(async () => {}),
			logout: jest.fn(async () => {}),
			checkAuthStatus: jest.fn(async () => {}),
			refreshToken: jest.fn(async () => {}),
			initializeAuth: jest.fn(async () => {}),
			clearError: jest.fn(() => {}),
			setLoading: jest.fn(() => {}),
		} as any);
		jest.clearAllMocks();
	});

	it('renders login button when not authenticated', () => {
		useAuthStore.setState({
			status: { type: 'NotAuthenticated' },
			isLoading: false,
			error: null,
		} as any);
		render(<AuthPanel />);
		expect(screen.getByTestId('auth-panel')).toBeTruthy();
		expect(screen.getByTestId('login-button')).toBeTruthy();
	});

	it('fires login when login button clicked (device method)', async () => {
		const user = userEvent.setup();
		const mockLogin = jest.fn(async (_opts?: any) => {});
		useAuthStore.setState({
			status: { type: 'NotAuthenticated' },
			login: mockLogin,
		} as any);
		render(<AuthPanel />);

		// deviceに切り替えて、未入力でもクリック可能で呼び出されることを確認
		await user.selectOptions(screen.getByTestId('auth-method-select'), 'device');
		await user.click(screen.getByTestId('login-button'));
		expect(mockLogin).toHaveBeenCalled();
	});

	it('PKCE: inputs required -> Login disabled until both fields filled', async () => {
		const user = userEvent.setup();
		const mockLogin = jest.fn(async (_opts?: any) => {});
		useAuthStore.setState({
			status: { type: 'NotAuthenticated' },
			login: mockLogin,
		} as any);
		render(<AuthPanel />);

		// 初期はpkce選択で、未入力 -> disabled
		const loginBtn = screen.getByTestId('login-button') as HTMLButtonElement;
		expect(loginBtn.disabled).toBe(true);

		await user.type(screen.getByTestId('start-url-input'), 'https://example.awsapps.com/start');
		expect(loginBtn.disabled).toBe(true);

		await user.type(screen.getByTestId('region-input'), 'us-west-2');
		expect(loginBtn.disabled).toBe(false);

		await user.click(loginBtn);
		expect(mockLogin).toHaveBeenCalledWith({
			method: 'pkce',
			start_url: 'https://example.awsapps.com/start',
			region: 'us-west-2',
		});
	});

	it('Device: login enabled without inputs and passes undefined values', async () => {
		const user = userEvent.setup();
		const mockLogin = jest.fn(async (_opts?: any) => {});
		useAuthStore.setState({
			status: { type: 'NotAuthenticated' },
			login: mockLogin,
		} as any);
		render(<AuthPanel />);

		await user.selectOptions(screen.getByTestId('auth-method-select'), 'device');
		const loginBtn = screen.getByTestId('login-button') as HTMLButtonElement;
		expect(loginBtn.disabled).toBe(false);
		await user.click(loginBtn);
		expect(mockLogin).toHaveBeenCalledWith({
			method: 'device',
			start_url: undefined,
			region: undefined,
		});
	});
});
