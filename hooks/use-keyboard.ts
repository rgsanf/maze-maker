import { useEffect } from 'react';
import type { Direction } from '@/lib/maze-types';

/**
 * Custom hook for handling arrow key events
 * @param onArrowKey - Callback function called when an arrow key is pressed
 * @param enabled - Whether the keyboard handler is active (default: true)
 */
export function useKeyboard(
  onArrowKey: (direction: Direction) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          onArrowKey('up');
          break;
        case 'ArrowDown':
          onArrowKey('down');
          break;
        case 'ArrowLeft':
          onArrowKey('left');
          break;
        case 'ArrowRight':
          onArrowKey('right');
          break;
        default:
          return; // Don't prevent default for other keys
      }
      e.preventDefault(); // Prevent page scrolling
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onArrowKey, enabled]);
}
