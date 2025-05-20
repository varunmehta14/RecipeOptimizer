import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility Functions Module
 * 
 * Contains general utility functions used throughout the application.
 */

/**
 * Combines multiple class values into a single className string
 * 
 * This function merges class names from multiple sources and handles:
 * - Conditional classes (e.g., when a class should only be applied under certain conditions)
 * - Deduplication of classes
 * - Properly merging Tailwind CSS classes (resolving conflicts with tailwind-merge)
 * 
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-200')
 * // => 'text-red-500 bg-blue-200'
 * 
 * @example
 * // With conditional classes
 * cn('text-base', isLarge && 'text-lg', isActive && 'font-bold')
 * // => 'text-base text-lg font-bold' (if both isLarge and isActive are true)
 * // => 'text-base text-lg' (if only isLarge is true)
 * // => 'text-base' (if both are false)
 * 
 * @example
 * // Resolving Tailwind conflicts
 * cn('text-red-500', 'text-blue-600')
 * // => 'text-blue-600' (the later class wins)
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, etc.)
 * @returns A merged className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 