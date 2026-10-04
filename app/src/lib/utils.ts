// ============================================================================
// AURA.ai - Utility Functions
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with tailwind-merge for optimal Tailwind CSS handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format large numbers (e.g., 1000000 -> "1M+")
 */
export function formatUsers(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1)}M+`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1)}K+`;
  }
  return count.toString();
}

/**
 * Get trust score color classes
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400 bg-green-400/10 border-green-400/20';
  if (score >= 70) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  return 'text-red-400 bg-red-400/10 border-red-400/20';
}

/**
 * Get pricing color classes
 */
export function getPricingColor(pricing: string): string {
  switch (pricing) {
    case 'Free':
      return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    case 'Freemium':
      return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
    case 'Premium':
      return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
    default:
      return 'text-white/80 border-white/10 bg-white/5';
  }
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'AI Tools': '🤖',
    'Design': '🎨',
    'Productivity': '💼',
    'Developer': '💻',
    'Writing': '✍️',
    'Video': '🎬',
    'Audio': '🎵',
  };
  return icons[category] || '🔧';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
