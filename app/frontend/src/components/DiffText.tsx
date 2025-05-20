import React from 'react';
import { diffWords } from 'diff';

/**
 * DiffText Component
 * 
 * A specialized component for visualizing differences between two text strings.
 * Uses word-level diffing rather than character-level to improve readability and
 * provide more meaningful differences for recipe modifications.
 * 
 * Added text is highlighted in green with bold formatting.
 * Removed text is highlighted in red with strikethrough formatting.
 * Unchanged text remains as is.
 */
interface DiffTextProps {
  /** The original unmodified text */
  originalText: string;
  /** The new modified text to compare against the original */
  optimizedText: string;
  /** Optional className for additional styling of the container */
  className?: string;
}

export function DiffText({ originalText, optimizedText, className }: DiffTextProps) {
  // Use diffWords to perform word-level diffing, which is more appropriate for
  // recipe text than character-level diffing (prevents splitting words)
  const differences = diffWords(originalText, optimizedText);

  return (
    <span className={className}>
      {differences.map((part, index) => {
        const style: React.CSSProperties = {};
        
        // Apply different styling based on whether text was added, removed, or unchanged
        if (part.added) {
          // Green background for added text with bold font
          style.backgroundColor = 'rgba(0, 200, 0, 0.2)';
          style.fontWeight = 'bold';
          style.padding = '0 2px';
          style.borderRadius = '2px';
        } else if (part.removed) {
          // Red background for removed text with strikethrough
          style.backgroundColor = 'rgba(255, 0, 0, 0.15)';
          style.textDecoration = 'line-through';
          style.padding = '0 2px';
          style.borderRadius = '2px';
        }
        
        // Only render if part has content (avoid empty spans)
        return part.value ? (
          <span key={index} style={style}>
            {part.value}
          </span>
        ) : null;
      })}
    </span>
  );
}