import type {
  Cell,
  Position,
  EnhancedMazeState,
  DeadEndInfo,
  EnhancementConfig,
} from './maze-types';
import { findShortestPath, identifyDeadEnds, analyzeMazeQuality } from './maze-analysis';

/**
 * Count the number of open passages from a cell
 */
function countOpenings(cell: Cell): number {
  let count = 0;
  if (!cell.walls.top) count++;
  if (!cell.walls.right) count++;
  if (!cell.walls.bottom) count++;
  if (!cell.walls.left) count++;
  return count;
}

/**
 * Check if a position is within grid bounds
 */
function isInBounds(row: number, col: number, height: number, width: number): boolean {
  return row >= 0 && row < height && col >= 0 && col < width;
}

/**
 * Get cells adjacent to current cell through walls
 */
function getWalledNeighbors(grid: Cell[][], cell: Cell): { cell: Cell; direction: string }[] {
  const neighbors: { cell: Cell; direction: string }[] = [];
  const { row, col } = cell;
  const height = grid.length;
  const width = grid[0].length;

  // Top
  if (row > 0 && cell.walls.top) {
    neighbors.push({ cell: grid[row - 1][col], direction: 'top' });
  }

  // Right
  if (col < width - 1 && cell.walls.right) {
    neighbors.push({ cell: grid[row][col + 1], direction: 'right' });
  }

  // Bottom
  if (row < height - 1 && cell.walls.bottom) {
    neighbors.push({ cell: grid[row + 1][col], direction: 'bottom' });
  }

  // Left
  if (col > 0 && cell.walls.left) {
    neighbors.push({ cell: grid[row][col - 1], direction: 'left' });
  }

  return neighbors;
}

/**
 * Get cells adjacent to current cell without walls
 */
function getOpenNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const { row, col } = cell;
  const height = grid.length;
  const width = grid[0].length;

  // Top
  if (row > 0 && !cell.walls.top) {
    neighbors.push(grid[row - 1][col]);
  }

  // Right
  if (col < width - 1 && !cell.walls.right) {
    neighbors.push(grid[row][col + 1]);
  }

  // Bottom
  if (row < height - 1 && !cell.walls.bottom) {
    neighbors.push(grid[row + 1][col]);
  }

  // Left
  if (col > 0 && !cell.walls.left) {
    neighbors.push(grid[row][col - 1]);
  }

  return neighbors;
}

/**
 * Remove wall between two adjacent cells
 */
function removeWall(cell1: Cell, cell2: Cell): void {
  const rowDiff = cell2.row - cell1.row;
  const colDiff = cell2.col - cell1.col;

  if (rowDiff === -1) {
    // cell2 is above cell1
    cell1.walls.top = false;
    cell2.walls.bottom = false;
  } else if (rowDiff === 1) {
    // cell2 is below cell1
    cell1.walls.bottom = false;
    cell2.walls.top = false;
  } else if (colDiff === -1) {
    // cell2 is left of cell1
    cell1.walls.left = false;
    cell2.walls.right = false;
  } else if (colDiff === 1) {
    // cell2 is right of cell1
    cell1.walls.right = false;
    cell2.walls.left = false;
  }
}

/**
 * Calculate target extension length based on position along solution path
 * Earlier positions get longer extensions
 */
function calculateTargetExtension(
  deadEnd: DeadEndInfo,
  solutionPath: Position[]
): number {
  if (!deadEnd.distanceAlongSolution) return 3;

  const progressRatio = deadEnd.distanceAlongSolution / solutionPath.length;

  // Early in solution (0-30%): 5-8 cells
  if (progressRatio < 0.3) return Math.floor(5 + Math.random() * 4);

  // Middle (30-70%): 3-5 cells
  if (progressRatio < 0.7) return Math.floor(3 + Math.random() * 3);

  // Near end (70-100%): 2-3 cells
  return Math.floor(2 + Math.random() * 2);
}

/**
 * Calculate score for extension direction
 * Prefer directions away from maze end
 */
function scoreExtensionDirection(
  currentRow: number,
  currentCol: number,
  direction: string,
  endRow: number,
  endCol: number
): number {
  let newRow = currentRow;
  let newCol = currentCol;

  if (direction === 'top') newRow--;
  else if (direction === 'bottom') newRow++;
  else if (direction === 'left') newCol--;
  else if (direction === 'right') newCol++;

  // Calculate distance to end before and after
  const distanceBefore = Math.abs(currentRow - endRow) + Math.abs(currentCol - endCol);
  const distanceAfter = Math.abs(newRow - endRow) + Math.abs(newCol - endCol);

  // Prefer directions that move away from end
  return distanceAfter - distanceBefore;
}

/**
 * Extend a single dead end
 */
function extendDeadEnd(
  grid: Cell[][],
  deadEnd: DeadEndInfo,
  targetLength: number,
  end: Position
): number {
  const height = grid.length;
  const width = grid[0].length;
  let current = grid[deadEnd.position.row][deadEnd.position.col];
  let extended = 0;
  const visited = new Set<string>();
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Safety limit

  while (extended < targetLength && iterations < MAX_ITERATIONS) {
    iterations++;
    visited.add(`${current.row},${current.col}`);

    // Get walled neighbors we could extend into
    const walledNeighbors = getWalledNeighbors(grid, current);

    if (walledNeighbors.length === 0) break;

    // Score each direction
    const scored = walledNeighbors.map((n) => ({
      ...n,
      score: scoreExtensionDirection(current.row, current.col, n.direction, end.row, end.col),
    }));

    // Sort by score (higher = better = away from end)
    scored.sort((a, b) => b.score - a.score);

    // Try to extend in best direction
    let extended_this_iteration = false;
    for (const option of scored) {
      const neighbor = option.cell;
      const key = `${neighbor.row},${neighbor.col}`;

      // Don't revisit cells or create loops
      if (visited.has(key)) continue;

      // Check if neighbor has too many openings (would create complex junction)
      const neighborOpenings = countOpenings(neighbor);
      if (neighborOpenings > 1) continue;

      // Extend into this cell
      removeWall(current, neighbor);
      current = neighbor;
      extended++;
      extended_this_iteration = true;
      break;
    }

    if (!extended_this_iteration) break;

    // Stop if we created a junction
    if (countOpenings(current) > 2) break;
  }

  return extended;
}

/**
 * Extend dead ends near the solution path, prioritizing earlier positions
 */
export function extendDeadEnds(
  grid: Cell[][],
  deadEnds: DeadEndInfo[],
  solutionPath: Position[],
  config: EnhancementConfig,
  end: Position
): number {
  // Filter for dead ends near solution
  const nearSolution = deadEnds.filter((de) => de.nearSolution);

  // Sort by distance along solution (ascending = earlier positions first)
  nearSolution.sort((a, b) => {
    const aPos = a.distanceAlongSolution ?? Infinity;
    const bPos = b.distanceAlongSolution ?? Infinity;
    return aPos - bPos;
  });

  // Select dead ends to extend
  const toExtend = nearSolution.slice(0, config.deadEndExtensions);

  let totalExtended = 0;
  for (const deadEnd of toExtend) {
    // Calculate target length based on position
    const targetLength = config.prioritizeEarlyDeadEnds
      ? calculateTargetExtension(deadEnd, solutionPath)
      : config.deadEndMinLength;

    // Only extend if currently shorter than target
    if (deadEnd.depth < targetLength) {
      const extended = extendDeadEnd(grid, deadEnd, targetLength - deadEnd.depth, end);
      totalExtended += extended;
    }
  }

  return totalExtended;
}

/**
 * Check if a position is on the solution path
 */
function isOnSolutionPath(pos: Position, solutionPath: Position[]): boolean {
  return solutionPath.some((p) => p.row === pos.row && p.col === pos.col);
}

/**
 * Carve a decoy path branching from a cell
 */
function carveDecoyPath(
  grid: Cell[][],
  start: Cell,
  minLength: number,
  maxLength: number,
  solutionPath: Position[]
): number {
  const targetLength = Math.floor(minLength + Math.random() * (maxLength - minLength + 1));
  const height = grid.length;
  const width = grid[0].length;
  let current = start;
  let carved = 0;
  const visited = new Set<string>();
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Safety limit

  while (carved < targetLength && iterations < MAX_ITERATIONS) {
    iterations++;
    visited.add(`${current.row},${current.col}`);

    // Get walled neighbors
    const walledNeighbors = getWalledNeighbors(grid, current);

    // Filter out cells on solution path
    const validOptions = walledNeighbors.filter((n) => {
      const key = `${n.cell.row},${n.cell.col}`;
      return (
        !visited.has(key) &&
        !isOnSolutionPath({ row: n.cell.row, col: n.cell.col }, solutionPath) &&
        countOpenings(n.cell) <= 1
      );
    });

    if (validOptions.length === 0) break;

    // Randomly select a direction
    const chosen = validOptions[Math.floor(Math.random() * validOptions.length)];
    removeWall(current, chosen.cell);
    current = chosen.cell;
    carved++;

    // Stop if we created a junction
    if (countOpenings(current) > 2) break;
  }

  return carved;
}

/**
 * Add decoy paths branching off the solution path
 */
export function addDecoyPaths(
  grid: Cell[][],
  solutionPath: Position[],
  count: number
): number {
  const candidates: { cell: Cell; quality: number; pathIndex: number }[] = [];

  // Find cells adjacent to solution path (through walls)
  for (let i = 0; i < solutionPath.length; i++) {
    const pathPos = solutionPath[i];
    const pathCell = grid[pathPos.row][pathPos.col];
    const walledNeighbors = getWalledNeighbors(grid, pathCell);

    for (const neighbor of walledNeighbors) {
      // Skip if already on solution path
      if (isOnSolutionPath({ row: neighbor.cell.row, col: neighbor.cell.col }, solutionPath)) {
        continue;
      }

      // Evaluate quality: prefer middle of solution, cells with few existing openings
      const progressRatio = i / solutionPath.length;
      const middleness = 1 - Math.abs(progressRatio - 0.5) * 2; // 1 at middle, 0 at ends
      const openings = countOpenings(neighbor.cell);
      const quality = middleness * 10 + (4 - openings) * 2;

      candidates.push({
        cell: neighbor.cell,
        quality,
        pathIndex: i,
      });
    }
  }

  // Sort by quality (descending)
  candidates.sort((a, b) => b.quality - a.quality);

  // Create decoy paths from top candidates
  let totalCarved = 0;
  const created = Math.min(count, candidates.length);

  for (let i = 0; i < created; i++) {
    const candidate = candidates[i];
    const carved = carveDecoyPath(grid, candidate.cell, 3, 6, solutionPath);
    totalCarved += carved;
  }

  return totalCarved;
}

/**
 * Enhance a maze with extended dead ends and decoy paths
 */
export function enhanceMaze(maze: EnhancedMazeState, config: EnhancementConfig): void {
  if (!maze.solutionPath) {
    console.warn('Cannot enhance maze without solution path');
    return;
  }

  const { grid, end, solutionPath } = maze;

  // Identify dead ends
  const deadEnds = identifyDeadEnds(grid, solutionPath, end);

  // Extend dead ends
  const extended = extendDeadEnds(grid, deadEnds, solutionPath, config, end);

  // Add decoy paths
  const decoysAdded = addDecoyPaths(grid, solutionPath, config.decoyPathCount);

  // Validate maze is still solvable
  const newSolution = findShortestPath(maze);
  if (!newSolution) {
    console.error('Enhancement made maze unsolvable!');
    return;
  }

  // Update maze with new solution and metrics
  maze.solutionPath = newSolution;
  maze.deadEnds = identifyDeadEnds(grid, newSolution, end);
  maze.metrics = analyzeMazeQuality(maze, newSolution);
}
