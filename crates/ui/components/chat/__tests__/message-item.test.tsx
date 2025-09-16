import '@testing-library/jest-dom';
import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageItem } from '../message-item';

describe('MessageItem', () => {
  test('shows error message and retry button for failed user message', async () => {
    const onRetry = jest.fn(async () => {});
    const failedUserMessage = {
      id: 'm1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: new Date(),
      status: 'failed' as const,
      error: 'Network error',
    };

    render(<MessageItem message={failedUserMessage} onRetry={onRetry} />);

    const errs = screen.getAllByText('Network error');
    expect(errs.length).toBeGreaterThanOrEqual(1);

    const retryButton = screen.getByTitle('Retry message');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledWith('m1');
  });

  test('shows streaming status for assistant message', () => {
    const streamingAssistantMessage = {
      id: 'm2',
      role: 'assistant' as const,
      content: 'partial',
      timestamp: new Date(),
      status: 'streaming' as const,
    };

    render(<MessageItem message={streamingAssistantMessage} />);

    expect(screen.getByText('Receiving...')).toBeInTheDocument();
  });
});


