import { cn } from '@/lib/utils';
import type { MazeState, Position } from '@/lib/maze-types';

interface MazeGridProps {
  maze: MazeState;
  playerPosition: Position;
  path: Position[];
}

export function MazeGrid({ maze, playerPosition, path }: MazeGridProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className="grid gap-0 border-4 border-black dark:border-white"
        style={{
          gridTemplateColumns: `repeat(${maze.width}, 1fr)`,
        }}
      >
        {maze.grid.map((row) =>
          row.map((cell) => {
            const isInPath = path.some(
              (p) => p.row === cell.row && p.col === cell.col
            );
            const isPlayer =
              playerPosition.row === cell.row &&
              playerPosition.col === cell.col;
            const isStart =
              maze.start.row === cell.row && maze.start.col === cell.col;
            const isEnd =
              maze.end.row === cell.row && maze.end.col === cell.col;

            return (
              <div
                key={`${cell.row}-${cell.col}`}
                className={cn(
                  'aspect-square relative',
                  cell.walls.top && 'border-t-2 border-black dark:border-white',
                  cell.walls.right && 'border-r-2 border-black dark:border-white',
                  cell.walls.bottom && 'border-b-2 border-black dark:border-white',
                  cell.walls.left && 'border-l-2 border-black dark:border-white',
                  isInPath && 'bg-red-600',
                  isPlayer && 'bg-yellow-400',
                  isStart && !isPlayer && 'bg-green-500/30',
                  isEnd && !isPlayer && 'bg-blue-500/30'
                )}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
