/**
 * Performance monitoring utilities for virtual scrolling
 */

export interface PerformanceMetrics {
  renderTime: number;
  scrollTime: number;
  memoryUsage?: number;
  visibleItems: number;
  totalItems: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements

  /**
   * Measure render performance
   */
  measureRender<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.addMetric({
      renderTime: end - start,
      scrollTime: 0,
      visibleItems: 0,
      totalItems: 0,
    });
    
    return result;
  }

  /**
   * Measure scroll performance
   */
  measureScroll(visibleItems: number, totalItems: number, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    this.addMetric({
      renderTime: 0,
      scrollTime: end - start,
      visibleItems,
      totalItems,
      memoryUsage: this.getMemoryUsage(),
    });
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get average render time
   */
  getAverageRenderTime(): number {
    const renderTimes = this.metrics
      .filter(m => m.renderTime > 0)
      .map(m => m.renderTime);
    
    if (renderTimes.length === 0) return 0;
    
    return renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
  }

  /**
   * Get average scroll time
   */
  getAverageScrollTime(): number {
    const scrollTimes = this.metrics
      .filter(m => m.scrollTime > 0)
      .map(m => m.scrollTime);
    
    if (scrollTimes.length === 0) return 0;
    
    return scrollTimes.reduce((sum, time) => sum + time, 0) / scrollTimes.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    avgRenderTime: number;
    avgScrollTime: number;
    maxRenderTime: number;
    maxScrollTime: number;
    memoryTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  } {
    const renderTimes = this.metrics.filter(m => m.renderTime > 0).map(m => m.renderTime);
    const scrollTimes = this.metrics.filter(m => m.scrollTime > 0).map(m => m.scrollTime);
    
    return {
      avgRenderTime: this.getAverageRenderTime(),
      avgScrollTime: this.getAverageScrollTime(),
      maxRenderTime: renderTimes.length > 0 ? Math.max(...renderTimes) : 0,
      maxScrollTime: scrollTimes.length > 0 ? Math.max(...scrollTimes) : 0,
      memoryTrend: this.getMemoryTrend(),
    };
  }

  /**
   * Analyze memory usage trend
   */
  private getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
    const memoryMetrics = this.metrics
      .filter(m => m.memoryUsage !== undefined)
      .map(m => m.memoryUsage!);
    
    if (memoryMetrics.length < 10) return 'unknown';
    
    const recent = memoryMetrics.slice(-10);
    const older = memoryMetrics.slice(-20, -10);
    
    if (older.length === 0) return 'unknown';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    const threshold = olderAvg * 0.05; // 5% threshold
    
    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for performance monitoring in React components
 */
export function usePerformanceMonitor() {
  const measureRender = <T>(fn: () => T): T => {
    return performanceMonitor.measureRender(fn);
  };

  const measureScroll = (visibleItems: number, totalItems: number, fn: () => void): void => {
    performanceMonitor.measureScroll(visibleItems, totalItems, fn);
  };

  const getSummary = () => {
    return performanceMonitor.getSummary();
  };

  return {
    measureRender,
    measureScroll,
    getSummary,
    clear: () => performanceMonitor.clear(),
    exportMetrics: () => performanceMonitor.exportMetrics(),
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}