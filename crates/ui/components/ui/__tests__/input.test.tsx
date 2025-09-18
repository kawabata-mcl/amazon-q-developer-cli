import '@testing-library/jest-dom';
import { describe, test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Input } from '../input';

describe('Input', () => {
  test('renders input element', () => {
    render(<Input placeholder="Enter text" />);
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');
    
    expect(handleChange).toHaveBeenCalledTimes(5); // One for each character
    expect(input).toHaveValue('Hello');
  });

  test('applies default styles', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('flex');
    expect(input).toHaveClass('h-9');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('px-3');
    expect(input).toHaveClass('py-1');
  });

  test('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('cursor-not-allowed');
    expect(input).toHaveClass('opacity-50');
  });

  test('applies error styles when error prop is true', () => {
    render(<Input error />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus-visible:ring-red-500');
  });

  test('applies custom className', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  test('forwards ref correctly', () => {
    const ref = { current: null };
    
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  test('supports different input types', () => {
    render(<Input type="password" />);
    
    const input = screen.getByRole('textbox', { hidden: true });
    expect(input).toHaveAttribute('type', 'password');
  });

  test('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('supports controlled input', () => {
    const { rerender } = render(<Input value="initial" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');
    
    rerender(<Input value="updated" onChange={() => {}} />);
    expect(input).toHaveValue('updated');
  });

  test('supports uncontrolled input with defaultValue', () => {
    render(<Input defaultValue="default text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('default text');
  });

  test('handles keyboard events', () => {
    const handleKeyDown = jest.fn();
    const handleKeyUp = jest.fn();
    
    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
    expect(handleKeyUp).toHaveBeenCalledTimes(1);
  });

  test('supports maxLength attribute', async () => {
    const user = userEvent.setup();
    render(<Input maxLength={5} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, '1234567890');
    
    expect(input).toHaveValue('12345'); // Should be limited to 5 characters
  });

  test('supports required attribute', () => {
    render(<Input required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  test('supports readonly attribute', () => {
    render(<Input readOnly value="readonly text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('readonly text');
  });

  test('applies focus styles on focus', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(input).toHaveFocus();
    expect(input).toHaveClass('focus-visible:outline-none');
    expect(input).toHaveClass('focus-visible:ring-1');
  });

  test('supports aria attributes', () => {
    render(
      <Input 
        aria-label="Search input"
        aria-describedby="search-help"
        aria-invalid="true"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Search input');
    expect(input).toHaveAttribute('aria-describedby', 'search-help');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});