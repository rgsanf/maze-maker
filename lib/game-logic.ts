import type { Direction, MazeState, Position } from './maze-types';

/**
 * Calculate new position based on direction
 */
export function getNewPosition(current: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { row: current.row - 1, col: current.col };
    case 'down':
      return { row: current.row + 1, col: current.col };
    case 'left':
      return { row: current.row, col: current.col - 1 };
    case 'right':
      return { row: current.row, col: current.col + 1 };
  }
}

/**
 * Check if a move is valid (no wall blocking and within bounds)
 */
export function canMove(
  maze: MazeState,
  from: Position,
  direction: Direction
): boolean {
  const { row, col } = from;
  const { width, height, grid } = maze;

  // Check bounds first
  const newPos = getNewPosition(from, direction);
  if (newPos.row < 0 || newPos.row >= height || newPos.col < 0 || newPos.col >= width) {
    return false;
  }

  // Check if wall exists in that direction
  const cell = grid[row][col];
  switch (direction) {
    case 'up':
      return !cell.walls.top;
    case 'down':
      return !cell.walls.bottom;
    case 'left':
      return !cell.walls.left;
    case 'right':
      return !cell.walls.right;
  }
}

/**
 * Check if moving to newPos is backtracking (going to second-to-last position)
 */
export function isBacktracking(path: Position[], newPos: Position): boolean {
  if (path.length < 2) return false;
  const secondToLast = path[path.length - 2];
  return secondToLast.row === newPos.row && secondToLast.col === newPos.col;
}

/**
 * Update path array with new position or backtrack
 */
export function updatePath(
  currentPath: Position[],
  newPosition: Position
): Position[] {
  if (isBacktracking(currentPath, newPosition)) {
    // Moving back: remove last position from path
    return currentPath.slice(0, -1);
  }
  // Moving forward: add new position to path
  return [...currentPath, newPosition];
}

/**
 * Check if player has reached the end
 */
export function checkWin(playerPos: Position, endPos: Position): boolean {
  return playerPos.row === endPos.row && playerPos.col === endPos.col;
}
