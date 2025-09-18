'use client';


import { MessageItem } from './message-item';
import { useHeightMeasurement } from '@/hooks/use-element-size';
import type { ChatMessage } from '@/types/chat';

interface VirtualMessageItemProps {
  message: ChatMessage;
  index: number;
  isLatest: boolean;
  onRetry?: (messageId: string) => Promise<void>;
  onHeightChange?: (index: number, height: number) => void;
  estimatedHeight?: number;
}

export function VirtualMessageItem({
  message,
  index,
  isLatest,
  onRetry,
  onHeightChange,
  estimatedHeight = 120,
}: VirtualMessageItemProps) {
  const ref = useHeightMeasurement<HTMLDivElement>((height) => {
    onHeightChange?.(index, height);
  });

  return (
    <div
      ref={ref}
      style={{
        minHeight: estimatedHeight,
      }}
      data-message-index={index}
      data-message-id={message.id}
    >
      <MessageItem
        message={message}
        isLatest={isLatest}
        onRetry={onRetry}
      />
    </div>
  );
}