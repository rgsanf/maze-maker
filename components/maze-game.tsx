'use client';

import { useState, useCallback, useEffect } from 'react';
import type { MazeState, PlayerState, Difficulty, Direction } from '@/lib/maze-types';
import { generateMaze, getDimensionsForDifficulty } from '@/lib/maze-generator';
import { canMove, getNewPosition, updatePath, checkWin } from '@/lib/game-logic';
import { useKeyboard } from '@/hooks/use-keyboard';
import { MazeGrid } from './maze-grid';
import { GameControls } from './game-controls';
import { WinModal } from './win-modal';

export default function MazeGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [mazeState, setMazeState] = useState<MazeState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    position: { row: 0, col: 0 },
    path: [{ row: 0, col: 0 }],
    hasWon: false,
  });

  // Generate initial maze
  useEffect(() => {
    generateNewMaze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNewMaze = useCallback(() => {
    const dimensions = getDimensionsForDifficulty(difficulty);
    const newMaze = generateMaze(dimensions.width, dimensions.height);

    setMazeState(newMaze);
    setPlayerState({
      position: newMaze.start,
      path: [newMaze.start],
      hasWon: false,
    });
  }, [difficulty]);

  const handleMove = useCallback(
    (direction: Direction) => {
      if (!mazeState || playerState.hasWon) return;

      if (canMove(mazeState, playerState.position, direction)) {
        const newPosition = getNewPosition(playerState.position, direction);
        const newPath = updatePath(playerState.path, newPosition);
        const hasWon = checkWin(newPosition, mazeState.end);

        setPlayerState({
          position: newPosition,
          path: newPath,
          hasWon,
        });
      }
    },
    [mazeState, playerState]
  );

  // Connect keyboard to movement
  useKeyboard(handleMove, !playerState.hasWon);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  // Generate new maze when difficulty changes
  useEffect(() => {
    if (mazeState) {
      generateNewMaze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Maze Navigator
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Use arrow keys to navigate from green (start) to blue (end)
        </p>
      </div>

      <GameControls
        onNewGame={generateNewMaze}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onMove={handleMove}
        disabled={playerState.hasWon}
      />

      {mazeState && (
        <MazeGrid
          maze={mazeState}
          playerPosition={playerState.position}
          path={playerState.path}
        />
      )}

      <WinModal isOpen={playerState.hasWon} onPlayAgain={generateNewMaze} />
    </div>
  );
}
