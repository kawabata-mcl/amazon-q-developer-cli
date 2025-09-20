import '@testing-library/jest-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../message-input';

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn<(message: string) => Promise<void>>();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSendMessage.mockResolvedValue(undefined);
  });

  test('renders input field and send button', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    expect(screen.getByTestId('message-input')).toBeTruthy();
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });

  test('sends message when send button is clicked', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('sends message when Shift+Enter key is pressed (implementation)', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByTestId('message-input');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });
    });
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('does not send message when plain Enter is pressed', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByTestId('message-input');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('clears input after sending message', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    
    const input = screen.getByTestId('message-input') as HTMLTextAreaElement;
    const sendButton = screen.getByTestId('send-button');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test message' } });
    });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });
    
    // Wait for the async operation to complete
    expect(input.value).toBe('');
  });

  test('does not send empty message', async () => {
    const user = userEvent.setup();
    
    render(<MessageInput onSendMessage={mockOnSendMessage} />);
    
    const sendButton = screen.getByTestId('send-button');
    
    await act(async () => {
      await user.click(sendButton);
    });
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('shows error UI and allows retry and dismiss', async () => {
    const user = userEvent.setup();

    mockOnSendMessage.mockRejectedValueOnce(new Error('send failed'));

    const onClear = jest.fn();
    render(
      <MessageInput 
        onSendMessage={mockOnSendMessage} 
        sendError={'Failed to send message'}
        onClearError={onClear}
      />
    );

    const input = screen.getByTestId('message-input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Text' } });
    });

    await act(async () => {
      await user.click(screen.getByTestId('send-button'));
    });

    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('Dismiss')).toBeTruthy();

    await act(async () => {
      await user.click(screen.getByText('Dismiss'));
    });
    expect(onClear).toHaveBeenCalled();
  });

  test('shows cancel and spinner while sending', () => {
    render(
      <MessageInput 
        onSendMessage={mockOnSendMessage}
        isSending={true}
        onCancelSend={jest.fn()}
      />
    );

    expect(screen.getByTestId('cancel-button')).toBeTruthy();
    expect(screen.getByTestId('sending-button')).toBeTruthy();
  });

  test('attaches files and includes in composed message', async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    render(<MessageInput onSendMessage={onSend} />);

    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });

    const inputFile = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(inputFile).toBeTruthy();

    // jsdom は files セッターを持たないので、DataTransfer を使ってイベントに files を載せる
    const data = new DataTransfer();
    data.items.add(file);

    await act(async () => {
      fireEvent.change(inputFile, { target: { files: data.files } });
    });

    // 添付ファイルの表示を待ってから送信（FileReader の onload 後に state 更新）
    await screen.findByText('note.txt');

    const ta = screen.getByTestId('message-input');
    await act(async () => {
      fireEvent.change(ta, { target: { value: 'Body' } });
      fireEvent.click(screen.getByTestId('send-button'));
    });

    const sent = onSend.mock.calls[0][0] as string;
    expect(sent).toContain('Body');
    expect(sent).toContain('Attached files:');
    expect(sent).toContain('note.txt');
    expect(sent).toContain('```');
  });

  test('disables input when disabled prop is true', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
    
    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');
    
    expect((input as HTMLTextAreaElement).disabled).toBe(true);
    expect((sendButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('shows custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder text';
    
    render(
      <MessageInput 
        onSendMessage={mockOnSendMessage} 
        placeholder={customPlaceholder}
      />
    );
    
    const input = screen.getByTestId('message-input');
    expect((input as HTMLTextAreaElement).getAttribute('placeholder')).toBe(customPlaceholder);
  });
});