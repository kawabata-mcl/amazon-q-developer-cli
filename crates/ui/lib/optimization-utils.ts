/**
 * State management optimization utilities
 * Provides tools for preventing unnecessary re-renders and optimizing async operations
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from './performance-utils';

/**
 * Shallow comparison for objects
 */
export function shallowEqual<T extends Record<string, any>>(obj1: T, obj2: T): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for nested objects (limited depth for performance)
 */
export function deepEqual(obj1: any, obj2: any, maxDepth = 3): boolean {
  if (maxDepth <= 0) return obj1 === obj2;
  
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key], maxDepth - 1)) return false;
  }
  
  return true;
}

/**
 * Memoization utility with custom equality function
 */
export function createMemoizer<T, R>(
  fn: (arg: T) => R,
  equalityFn: (a: T, b: T) => boolean = Object.is
) {
  let lastArg: T;
  let lastResult: R;
  let hasResult = false;

  return (arg: T): R => {
    if (!hasResult || !equalityFn(arg, lastArg)) {
      lastArg = arg;
      lastResult = fn(arg);
      hasResult = true;
    }
    return lastResult;
  };
}

/**
 * Hook for stable callback references with dependency optimization
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: readonly unknown[]
): T {
  const ref = useRef<T>(callback);
  
  // Update ref when dependencies change
  useEffect(() => {
    ref.current = callback;
  }, [callback, ...deps]);
  
  // Return stable callback that always calls the latest version
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
}

/**
 * Hook for memoized values with custom equality
 */
export function useMemoWithEquality<T>(
  factory: () => T,
  deps: React.DependencyList,
  equalityFn: (a: T, b: T) => boolean = Object.is
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T } | null>(null);
  
  if (!ref.current || !depsEqual(ref.current.deps, deps)) {
    const newValue = factory();
    
    if (!ref.current || !equalityFn(ref.current.value, newValue)) {
      ref.current = { deps: [...deps], value: newValue };
    }
  }
  
  return (ref.current as { deps: React.DependencyList; value: T }).value;
}

/**
 * Compare dependency arrays for equality
 */
function depsEqual(deps1: React.DependencyList, deps2: React.DependencyList): boolean {
  if (deps1.length !== deps2.length) return false;
  
  for (let i = 0; i < deps1.length; i++) {
    if (!Object.is(deps1[i], deps2[i])) return false;
  }
  
  return true;
}

/**
 * Hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledFn = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );
  
  return throttledFn as T;
}

/**
 * Hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedFn = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
  
  return debouncedFn as T;
}

/**
 * Async operation manager for handling concurrent requests
 */
export class AsyncOperationManager {
  private operations = new Map<string, AbortController>();
  
  /**
   * Execute an async operation with cancellation support
   */
  async execute<T>(
    key: string,
    operation: (signal: AbortSignal) => Promise<T>,
    options: {
      cancelPrevious?: boolean;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { cancelPrevious = true, timeout } = options;
    
    // Cancel previous operation if requested
    if (cancelPrevious && this.operations.has(key)) {
      this.cancel(key);
    }
    
    // Create new abort controller
    const controller = new AbortController();
    this.operations.set(key, controller);
    
    try {
      // Set up timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (timeout) {
        timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);
      }
      
      // Execute operation
      const result = await operation(controller.signal);
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return result;
    } catch (error) {
      // Re-throw non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
      throw error;
    } finally {
      // Clean up
      this.operations.delete(key);
    }
  }
  
  /**
   * Cancel an operation by key
   */
  cancel(key: string): void {
    const controller = this.operations.get(key);
    if (controller) {
      controller.abort();
      this.operations.delete(key);
    }
  }
  
  /**
   * Cancel all operations
   */
  cancelAll(): void {
    for (const [, controller] of this.operations) {
      controller.abort();
    }
    this.operations.clear();
  }
  
  /**
   * Check if an operation is running
   */
  isRunning(key: string): boolean {
    return this.operations.has(key);
  }
  
  /**
   * Get all running operation keys
   */
  getRunningOperations(): string[] {
    return Array.from(this.operations.keys());
  }
}

/**
 * Hook for managing async operations with cancellation
 */
export function useAsyncOperation() {
  const managerRef = useRef(new AsyncOperationManager());
  
  useEffect(() => {
    const manager = managerRef.current;
    
    // Cancel all operations on unmount
    return () => {
      manager.cancelAll();
    };
  }, []);
  
  return managerRef.current;
}

/**
 * Batch state updates to prevent multiple re-renders
 */
export function batchUpdates(updates: (() => void)[]): void {
  // Use React's unstable_batchedUpdates if available
  if (typeof (React as any).unstable_batchedUpdates === 'function') {
    (React as any).unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  } else {
    // Fallback: execute updates synchronously
    updates.forEach(update => update());
  }
}

/**
 * Hook for batched state updates
 */
export function useBatchedUpdates() {
  const pendingUpdates = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const addUpdate = useCallback((update: () => void) => {
    pendingUpdates.current.push(update);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Schedule batch execution
    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdates.current;
      pendingUpdates.current = [];
      batchUpdates(updates);
    }, 0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return addUpdate;
}

/**
 * Selector hook for optimized store subscriptions
 */
export function useSelector<TState, TSelected>(
  store: { getState: () => TState; subscribe: (listener: () => void) => () => void },
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean = Object.is
): TSelected {
  const [, forceRender] = React.useReducer(c => c + 1, 0);
  
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  const selectedRef = useRef<TSelected | null>(null);
  const hasSelectedRef = useRef(false);
  
  // Update refs
  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;
  
  // Get current selected value
  const currentState = store.getState();
  const currentSelected = selectorRef.current(currentState);
  
  // Check if we need to update
  if (!hasSelectedRef.current || !equalityFnRef.current(selectedRef.current as TSelected, currentSelected)) {
    selectedRef.current = currentSelected;
    hasSelectedRef.current = true;
  }
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newState = store.getState();
      const newSelected = selectorRef.current(newState);
      
      if (!equalityFnRef.current(selectedRef.current as TSelected, newSelected)) {
        selectedRef.current = newSelected;
        forceRender();
      }
    });
    
    return unsubscribe;
  }, [store]);
  
  return selectedRef.current as TSelected;
}

// Re-export React for convenience
import React from 'react';