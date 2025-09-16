'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { VirtualMessageItem } from './virtual-message-item';
import { Spinner } from '@/components/ui/spinner';
import { useVirtualScroll, useScrollManager } from '@/hooks/use-virtual-scroll';
import type { ChatMessage } from '@/types/chat';

interface VirtualMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  onRetryMessage?: (messageId: string) => Promise<void>;
  itemHeight?: number;
  containerHeight?: number;
  enableDynamicHeight?: boolean;
}

const DEFAULT_ITEM_HEIGHT = 120; // Estimated height per message
const DEFAULT_CONTAINER_HEIGHT = 600; // Default container height

export function VirtualMessageList({
  messages,
  isLoading = false,
  className = '',
  onRetryMessage,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  enableDynamicHeight = true,
}: VirtualMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualContainerHeight, setActualContainerHeight] = useState(containerHeight);
  
  // Virtual scroll calculations
  const {
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    measureItem,
    setScrollOffset,
  } = useVirtualScroll({
    itemHeight,
    containerHeight: actualContainerHeight,
    overscan: 3,
    totalItems: messages.length,
    dynamicHeight: enableDynamicHeight,
  });

  // Scroll management
  const {
    shouldAutoScroll,
    isNearBottom,
    handleScroll,
    scrollToBottom,
  } = useScrollManager();

  // Measure actual container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setActualContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    
    // Initial measurement
    setActualContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && containerRef.current) {
      scrollToBottom(containerRef.current);
    }
  }, [messages.length, shouldAutoScroll, scrollToBottom]);

  // Auto-scroll when loading state changes
  useEffect(() => {
    if (isLoading && shouldAutoScroll && containerRef.current) {
      scrollToBottom(containerRef.current);
    }
  }, [isLoading, shouldAutoScroll, scrollToBottom]);

  // Handle scroll events with throttling
  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollOffset(target.scrollTop);
    handleScroll(event.nativeEvent);
  }, [handleScroll, setScrollOffset]);

  // Handle item height measurement
  const handleHeightChange = useCallback((index: number, height: number) => {
    measureItem(index, height);
  }, [measureItem]);

  // Memoize visible messages to prevent unnecessary re-renders
  const visibleMessages = useMemo(() => {
    return messages.slice(startIndex, endIndex + 1);
  }, [messages, startIndex, endIndex]);

  // Render empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto ${className}`}
        data-testid="virtual-message-list"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Start a conversation!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto ${className}`}
      onScroll={onScroll}
      data-testid="virtual-message-list"
      style={{
        // Optimize scrolling performance
        willChange: 'scroll-position',
        contain: 'layout style paint',
      }}
    >
      {/* Virtual scroll container */}
      <div 
        style={{ 
          height: totalHeight,
          position: 'relative',
        }}
      >
        {/* Visible messages container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            // Optimize rendering performance
            willChange: 'transform',
          }}
        >
          <div className="max-w-4xl mx-auto space-y-6 p-4">
            {visibleMessages.map((message, index) => {
              const actualIndex = startIndex + index;
              return (
                <VirtualMessageItem
                  key={message.id}
                  message={message}
                  index={actualIndex}
                  isLatest={actualIndex === messages.length - 1}
                  onRetry={onRetryMessage}
                  onHeightChange={enableDynamicHeight ? handleHeightChange : undefined}
                  estimatedHeight={itemHeight}
                />
              );
            })}
            
            {/* Loading indicator for streaming responses */}
            {isLoading && (
              <div 
                className="flex items-start space-x-4"
                style={{
                  minHeight: itemHeight,
                }}
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Q</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        Amazon Q is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!isNearBottom && (
        <button
          onClick={() => containerRef.current && scrollToBottom(containerRef.current)}
          className="fixed bottom-20 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors z-10"
          aria-label="Scroll to bottom"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}

      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Total: {messages.length}</div>
          <div>Visible: {endIndex - startIndex + 1}</div>
          <div>Range: {startIndex}-{endIndex}</div>
          <div>Height: {Math.round(totalHeight)}px</div>
        </div>
      )}
    </div>
  );
}