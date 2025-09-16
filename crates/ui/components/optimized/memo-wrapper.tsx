'use client';

import React, { memo, forwardRef } from 'react';
import { shallowEqual, deepEqual } from '@/lib/optimization-utils';

/**
 * Enhanced memo wrapper with custom comparison functions
 */
export interface MemoWrapperProps<T = any> {
  children: React.ReactNode;
  deps?: T;
  compareMode?: 'shallow' | 'deep' | 'reference';
  maxDepth?: number;
}

/**
 * Memo wrapper component with configurable comparison
 */
export const MemoWrapper = memo(<T,>({ 
  children, 
  deps, 
  compareMode = 'shallow',
  maxDepth = 3 
}: MemoWrapperProps<T>) => {
  return <>{children}</>;
}, (prevProps, nextProps) => {
  // Compare children first (reference equality)
  if (prevProps.children !== nextProps.children) {
    return false;
  }
  
  // If no deps, consider equal
  if (!prevProps.deps && !nextProps.deps) {
    return true;
  }
  
  // If one has deps and other doesn't, not equal
  if (!prevProps.deps || !nextProps.deps) {
    return false;
  }
  
  // Compare based on mode
  switch (prevProps.compareMode) {
    case 'reference':
      return prevProps.deps === nextProps.deps;
    case 'deep':
      return deepEqual(prevProps.deps, nextProps.deps, prevProps.maxDepth || 3);
    case 'shallow':
    default:
      return shallowEqual(prevProps.deps as any, nextProps.deps as any);
  }
});

MemoWrapper.displayName = 'MemoWrapper';

/**
 * HOC for memoizing components with custom comparison
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  compareMode: 'shallow' | 'deep' | 'reference' = 'shallow',
  maxDepth = 3
) {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    switch (compareMode) {
      case 'reference':
        return prevProps === nextProps;
      case 'deep':
        return deepEqual(prevProps, nextProps, maxDepth);
      case 'shallow':
      default:
        return shallowEqual(prevProps as any, nextProps as any);
    }
  });
  
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  
  return MemoizedComponent;
}

/**
 * Memoized component for expensive renders
 */
export interface OptimizedComponentProps {
  children: React.ReactNode;
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean;
  debugName?: string;
}

export const OptimizedComponent = memo(({ 
  children, 
  shouldUpdate,
  debugName 
}: OptimizedComponentProps) => {
  if (process.env.NODE_ENV === 'development' && debugName) {
    console.log(`Rendering ${debugName}`);
  }
  
  return <>{children}</>;
}, (prevProps, nextProps) => {
  if (prevProps.shouldUpdate) {
    return !prevProps.shouldUpdate(prevProps, nextProps);
  }
  
  // Default shallow comparison
  return shallowEqual(prevProps as any, nextProps as any);
});

OptimizedComponent.displayName = 'OptimizedComponent';

/**
 * Memoized forwardRef component
 */
export function memoForwardRef<T, P = {}>(
  Component: React.ForwardRefRenderFunction<T, P>,
  compareMode: 'shallow' | 'deep' | 'reference' = 'shallow'
) {
  const ForwardedComponent = forwardRef(Component);
  
  const MemoizedForwardRef = memo(ForwardedComponent, (prevProps, nextProps) => {
    switch (compareMode) {
      case 'reference':
        return prevProps === nextProps;
      case 'deep':
        return deepEqual(prevProps, nextProps);
      case 'shallow':
      default:
        return shallowEqual(prevProps as any, nextProps as any);
    }
  });
  
  MemoizedForwardRef.displayName = `MemoForwardRef(${Component.displayName || Component.name})`;
  
  return MemoizedForwardRef;
}

/**
 * Hook for conditional rendering based on dependencies
 */
export function useConditionalRender<T>(
  renderFn: () => React.ReactNode,
  deps: T,
  compareMode: 'shallow' | 'deep' | 'reference' = 'shallow'
): React.ReactNode {
  const memoizedRender = React.useMemo(() => {
    return renderFn();
  }, [renderFn, deps, compareMode]);
  
  return memoizedRender;
}

/**
 * Component for lazy rendering of expensive content
 */
export interface LazyRenderProps {
  children: React.ReactNode;
  when: boolean;
  fallback?: React.ReactNode;
  delay?: number;
}

export const LazyRender = memo(({ 
  children, 
  when, 
  fallback = null, 
  delay = 0 
}: LazyRenderProps) => {
  const [shouldRender, setShouldRender] = React.useState(when && delay === 0);
  
  React.useEffect(() => {
    if (when) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldRender(true);
        }, delay);
        
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    } else {
      setShouldRender(false);
    }
  }, [when, delay]);
  
  if (!shouldRender) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
});

LazyRender.displayName = 'LazyRender';