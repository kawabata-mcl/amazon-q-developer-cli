import { describe, test, expect } from '@jest/globals';
import { cn, formatFileSize, formatDate, truncateText, debounce, throttle } from '../utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    test('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    test('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    test('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    test('handles Tailwind class conflicts', () => {
      // tailwind-merge should resolve conflicts
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    test('handles empty input', () => {
      expect(cn()).toBe('');
    });

    test('handles array of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });
  });

  describe('formatFileSize', () => {
    test('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    test('formats KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    test('formats MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    test('formats GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    test('handles negative values', () => {
      expect(formatFileSize(-1024)).toBe('0 Bytes');
    });

    test('handles very large values', () => {
      const largeValue = 1024 * 1024 * 1024 * 1024; // 1 TB
      expect(formatFileSize(largeValue)).toBe('1024.0 GB'); // Should cap at GB
    });
  });

  describe('formatDate', () => {
    test('formats date with default options', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Dec 25, 2023/); // Basic format check
    });

    test('formats date with custom options', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(formatted).toMatch(/December 25, 2023/);
    });

    test('formats time when includeTime is true', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date, undefined, true);
      expect(formatted).toMatch(/10:30/); // Should include time
    });

    test('handles invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate)).not.toThrow();
    });
  });

  describe('truncateText', () => {
    test('truncates text longer than maxLength', () => {
      expect(truncateText('Hello world', 5)).toBe('Hello...');
    });

    test('returns original text if shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    test('returns original text if equal to maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    test('handles empty string', () => {
      expect(truncateText('', 5)).toBe('');
    });

    test('uses custom suffix', () => {
      expect(truncateText('Hello world', 5, ' [more]')).toBe('Hello [more]');
    });

    test('handles maxLength of 0', () => {
      expect(truncateText('Hello', 0)).toBe('...');
    });

    test('handles negative maxLength', () => {
      expect(truncateText('Hello', -1)).toBe('...');
    });
  });

  describe('debounce', () => {
    test('delays function execution', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    test('cancels previous calls', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      setTimeout(() => debouncedFn(), 50);
      setTimeout(() => debouncedFn(), 75);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 200);
    });

    test('passes arguments correctly', (done) => {
      let receivedArgs: any[] = [];
      const fn = (...args: any[]) => { receivedArgs = args; };
      const debouncedFn = debounce(fn, 50);

      debouncedFn('arg1', 'arg2', 123);

      setTimeout(() => {
        expect(receivedArgs).toEqual(['arg1', 'arg2', 123]);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    test('limits function execution rate', (done) => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttledFn = throttle(fn, 100);

      throttledFn(); // Should execute immediately
      throttledFn(); // Should be throttled
      throttledFn(); // Should be throttled

      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFn(); // Should execute after throttle period
        expect(callCount).toBe(2);
        done();
      }, 150);
    });

    test('executes immediately on first call', () => {
      let callCount = 0;
      const fn = () => { callCount++; };
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(callCount).toBe(1);
    });

    test('passes arguments correctly', () => {
      let receivedArgs: any[] = [];
      const fn = (...args: any[]) => { receivedArgs = args; };
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2', 123);
      expect(receivedArgs).toEqual(['arg1', 'arg2', 123]);
    });

    test('maintains context', () => {
      const obj = {
        value: 42,
        getValue: function() { return this.value; }
      };

      let result: any;
      const throttledFn = throttle(function(this: typeof obj) {
        result = this.getValue();
      }, 100);

      throttledFn.call(obj);
      expect(result).toBe(42);
    });
  });
});