import type { Difficulty, Direction } from '@/lib/maze-types';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameControlsProps {
  onNewGame: () => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onMove: (direction: Direction) => void;
  disabled?: boolean;
}

export function GameControls({
  onNewGame,
  difficulty,
  onDifficultyChange,
  onMove,
  disabled = false,
}: GameControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onNewGame}
          className="px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
        >
          New Game
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="difficulty" className="font-medium">
            Difficulty:
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-background"
          >
            <option value="easy">Easy (10x10)</option>
            <option value="medium">Medium (15x15)</option>
            <option value="hard">Hard (20x20)</option>
          </select>
        </div>
      </div>

      {/* Touch controls for mobile - hidden on desktop */}
      <div className="md:hidden flex flex-col items-center gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          Touch controls:
        </p>
        <div className="flex flex-col items-center gap-2">
          {/* Up button */}
          <button
            onClick={() => onMove('up')}
            disabled={disabled}
            className="p-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg active:bg-zinc-300 dark:active:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* Left, Down, Right buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMove('left')}
              disabled={disabled}
              className="p-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg active:bg-zinc-300 dark:active:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Move left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={disabled}
              className="p-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg active:bg-zinc-300 dark:active:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <button
              onClick={() => onMove('right')}
              disabled={disabled}
              className="p-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg active:bg-zinc-300 dark:active:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Move right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
