import '@testing-library/jest-dom';
import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import { Spinner } from '../spinner';

describe('Spinner', () => {
  test('renders spinner with default props', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  test('applies default size styles', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('w-4');
  });

  test('applies small size styles', () => {
    render(<Spinner size="sm" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-3');
    expect(spinner).toHaveClass('w-3');
  });

  test('applies medium size styles', () => {
    render(<Spinner size="md" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-5');
    expect(spinner).toHaveClass('w-5');
  });

  test('applies large size styles', () => {
    render(<Spinner size="lg" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-6');
    expect(spinner).toHaveClass('w-6');
  });

  test('applies extra large size styles', () => {
    render(<Spinner size="xl" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('h-8');
    expect(spinner).toHaveClass('w-8');
  });

  test('applies custom className', () => {
    render(<Spinner className="custom-spinner" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('custom-spinner');
  });

  test('applies default color styles', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('text-gray-600');
  });

  test('maintains accessibility attributes', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('can override aria-label', () => {
    render(<Spinner aria-label="Custom loading message" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
  });

  test('renders SVG element', () => {
    render(<Spinner />);
    
    const svg = screen.getByTestId('spinner');
    expect(svg.tagName).toBe('svg');
  });

  test('has correct SVG attributes', () => {
    render(<Spinner />);
    
    const svg = screen.getByTestId('spinner');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
  });

  test('contains circle elements', () => {
    render(<Spinner />);
    
    const svg = screen.getByTestId('spinner');
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(2); // Should have 2 circles for the spinner effect
  });

  test('applies animation class', () => {
    render(<Spinner />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
  });

  test('can be used inline with text', () => {
    render(
      <div>
        Loading <Spinner size="sm" /> Please wait...
      </div>
    );
    
    expect(screen.getByText('Loading')).toBeInTheDocument();
    // Text nodes may be split by inline SVG; use regex matcher
    expect(screen.getByText(/Please\s*wait\.\.\./)).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('supports different color variants through className', () => {
    render(<Spinner className="text-blue-500" />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('text-blue-500');
  });

  test('maintains consistent aspect ratio', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<Spinner size={size} />);
      const spinner = screen.getByTestId('spinner');
      
      // Check that width and height classes are consistent
      const classList = Array.from(spinner.classList);
      const widthClass = classList.find(cls => cls.startsWith('w-'));
      const heightClass = classList.find(cls => cls.startsWith('h-'));
      
      expect(widthClass).toBeDefined();
      expect(heightClass).toBeDefined();
      expect(widthClass?.replace('w-', '')).toBe(heightClass?.replace('h-', ''));
      
      unmount();
    });
  });
});