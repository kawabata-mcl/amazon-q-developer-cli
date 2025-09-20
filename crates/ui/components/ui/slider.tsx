'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    value = [0], 
    onValueChange, 
    min = 0, 
    max = 100, 
    step = 1, 
    disabled = false, 
    className,
    ...props 
  }, ref) => {
    const currentValue = value[0] || 0;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="absolute h-full bg-blue-600 dark:bg-blue-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer opacity-0',
            'disabled:cursor-not-allowed'
          )}
        />
        <div
          className={cn(
            'absolute block h-5 w-5 rounded-full border-2 border-blue-600 bg-white shadow transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'dark:border-blue-500'
          )}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };