import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions,
  includeTime?: boolean
): string {
  // Guard invalid dates
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  const dateOptions = { ...baseOptions, ...(options ?? {}) };

  const datePart = new Intl.DateTimeFormat('en-US', dateOptions).format(date);

  if (!includeTime) {
    return datePart;
  }

  // Stable time rendering across timezones: format in UTC as HH:mm
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const timePart = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return `${datePart}, ${timePart}`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minutes ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hours ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} days ago`;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (maxLength <= 0) return suffix;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 Bytes';
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (bytes < kb) return `${bytes} Bytes`;
  if (bytes < mb) return `${(bytes / kb).toFixed(1)} KB`;
  if (bytes < gb) return `${(bytes / mb).toFixed(1)} MB`;
  return `${(bytes / gb).toFixed(1)} GB`;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let last = 0;
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  } as T;
}