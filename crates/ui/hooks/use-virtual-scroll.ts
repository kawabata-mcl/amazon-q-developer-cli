'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { throttle, performanceMonitor } from '@/lib/performance-utils';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  totalItems: number;
  dynamicHeight?: boolean;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
  totalHeight: number;
  measureItem: (index: number, height: number) => void;
  /**
   * Update the current scroll offset (in pixels) to recalculate visible range
   */
  setScrollOffset: (scrollTop: number) => void;
}

/**
 * Custom hook for virtual scrolling implementation with dynamic height support
 * Optimizes rendering of large lists by only rendering visible items
 */
export function useVirtualScroll({
  itemHeight,
  containerHeight,
  overscan = 5,
  totalItems,
  dynamicHeight = false,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeights = useRef<Map<number, number>>(new Map());
  const [, forceUpdate] = useState({});

  // Measure item height for dynamic sizing
  const measureItem = useCallback((index: number, height: number) => {
    if (dynamicHeight && height > 0) {
      const currentHeight = itemHeights.current.get(index);
      if (currentHeight !== height) {
        itemHeights.current.set(index, height);
        forceUpdate({});
      }
    }
  }, [dynamicHeight]);

  // Get item height (dynamic or fixed)
  const getItemHeight = useCallback((index: number) => {
    if (dynamicHeight) {
      return itemHeights.current.get(index) || itemHeight;
    }
    return itemHeight;
  }, [dynamicHeight, itemHeight]);

  // Calculate item positions for dynamic heights
  const itemPositions = useMemo(() => {
    if (!dynamicHeight) {
      return null;
    }

    const positions: number[] = [];
    let totalHeight = 0;

    for (let i = 0; i < totalItems; i++) {
      positions[i] = totalHeight;
      totalHeight += getItemHeight(i);
    }

    return { positions, totalHeight };
  }, [dynamicHeight, totalItems, getItemHeight, itemHeights.current.size]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (dynamicHeight && itemPositions) {
      // Binary search for start index
      let startIndex = 0;
      let endIndex = totalItems - 1;

      while (startIndex < endIndex) {
        const mid = Math.floor((startIndex + endIndex) / 2);
        if (itemPositions.positions[mid] < scrollTop) {
          startIndex = mid + 1;
        } else {
          endIndex = mid;
        }
      }

      startIndex = Math.max(0, startIndex - overscan);

      // Find end index
      let visibleHeight = 0;
      let currentIndex = startIndex;
      
      while (currentIndex < totalItems && visibleHeight < containerHeight + overscan * itemHeight) {
        visibleHeight += getItemHeight(currentIndex);
        currentIndex++;
      }

      endIndex = Math.min(totalItems - 1, currentIndex + overscan);

      return {
        startIndex,
        endIndex,
        visibleItems: endIndex - startIndex + 1,
      };
    } else {
      // Fixed height calculation
      const visibleItems = Math.ceil(containerHeight / itemHeight);
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        totalItems - 1,
        startIndex + visibleItems + overscan * 2
      );

      return {
        startIndex,
        endIndex,
        visibleItems,
      };
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems, dynamicHeight, itemPositions, getItemHeight]);

  // Calculate total height and offset
  const totalHeight = dynamicHeight && itemPositions 
    ? itemPositions.totalHeight 
    : totalItems * itemHeight;

  const offsetY = dynamicHeight && itemPositions
    ? itemPositions.positions[visibleRange.startIndex] || 0
    : visibleRange.startIndex * itemHeight;

  return {
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    visibleItems: visibleRange.visibleItems,
    offsetY,
    totalHeight,
    measureItem,
    setScrollOffset: setScrollTop,
  };
}

/**
 * Hook for managing scroll position and auto-scroll behavior with throttling
 */
export function useScrollManager() {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(
    throttle((event: Event) => {
      performanceMonitor.measureScroll(0, 0, () => {
        const target = event.target as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = target;
        
        // Check if user is near the bottom (within 100px)
        const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsNearBottom(nearBottom);
        
        // Auto-scroll should be enabled when user is near bottom
        setShouldAutoScroll(nearBottom);
      });
    }, 16), // ~60fps throttling
    []
  );

  const scrollToBottom = useCallback((container: HTMLElement, smooth = true) => {
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }, []);

  const scrollToIndex = useCallback((
    container: HTMLElement,
    index: number,
    itemHeight: number,
    smooth = true
  ) => {
    const targetScrollTop = index * itemHeight;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: targetScrollTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    shouldAutoScroll,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    scrollToIndex,
    setShouldAutoScroll,
  };
}