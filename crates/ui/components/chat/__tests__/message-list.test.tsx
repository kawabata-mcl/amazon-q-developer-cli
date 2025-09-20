import '@testing-library/jest-dom';
import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../message-list';

describe('MessageList', () => {
  test('shows loading indicator when isLoading is true', () => {
    // mock scrollIntoView for JSDOM
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
    });
    render(
      <MessageList
        messages={[]}
        isLoading={true}
      />
    );

    const el = screen.getByText('Amazon Q is thinking...');
    expect(!!el).toBe(true);
  });
});


