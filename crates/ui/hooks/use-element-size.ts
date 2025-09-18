'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Hook to measure element dimensions
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T | null>,
  ElementSize
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (ref.current) {
      const { offsetWidth, offsetHeight } = ref.current;
      setSize({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial measurement
    updateSize();

    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateSize]);

  return [ref, size];
}

/**
 * Hook to measure element height and report changes
 */
export function useHeightMeasurement<T extends HTMLElement = HTMLDivElement>(
  onHeightChange?: (height: number) => void
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const lastHeight = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureHeight = () => {
      const height = element.offsetHeight;
      if (height !== lastHeight.current && height > 0) {
        lastHeight.current = height;
        onHeightChange?.(height);
      }
    };

    // Initial measurement
    measureHeight();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(element);

    // Also measure on content changes (for dynamic content)
    const mutationObserver = new MutationObserver(measureHeight);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [onHeightChange]);

  return ref;
}