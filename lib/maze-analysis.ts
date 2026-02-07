import type {
  MazeState,
  Position,
  Cell,
  DeadEndInfo,
  MazeQualityMetrics,
  EnhancedMazeState,
} from './maze-types';

/**
 * Check if two positions are equal
 */
function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Get valid neighboring cells (no wall between current and neighbor)
 */
function getValidNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const { row, col } = cell;
  const height = grid.length;
  const width = grid[0].length;

  // Top neighbor
  if (row > 0 && !cell.walls.top) {
    neighbors.push(grid[row - 1][col]);
  }

  // Right neighbor
  if (col < width - 1 && !cell.walls.right) {
    neighbors.push(grid[row][col + 1]);
  }

  // Bottom neighbor
  if (row < height - 1 && !cell.walls.bottom) {
    neighbors.push(grid[row + 1][col]);
  }

  // Left neighbor
  if (col > 0 && !cell.walls.left) {
    neighbors.push(grid[row][col - 1]);
  }

  return neighbors;
}

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
 * Find the shortest path from start to end using BFS
 */
export function findShortestPath(maze: MazeState): Position[] | null {
  const { grid, start, end } = maze;
  const height = grid.length;
  const width = grid[0].length;

  // Queue for BFS: [cell, path to cell]
  const queue: [Cell, Position[]][] = [[grid[start.row][start.col], [start]]];

  // Track visited cells
  const visited = new Set<string>();
  visited.add(`${start.row},${start.col}`);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;

    // Check if we reached the end
    if (positionsEqual({ row: current.row, col: current.col }, end)) {
      return path;
    }

    // Explore neighbors
    const neighbors = getValidNeighbors(grid, current);
    for (const neighbor of neighbors) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([neighbor, [...path, { row: neighbor.row, col: neighbor.col }]]);
      }
    }
  }

  return null; // No path found
}

/**
 * Calculate the distance from a position to the nearest point on a path
 */
function distanceToPath(pos: Position, path: Position[]): { minDistance: number; nearestIndex: number } {
  let minDistance = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < path.length; i++) {
    const distance = Math.abs(pos.row - path[i].row) + Math.abs(pos.col - path[i].col);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return { minDistance, nearestIndex };
}

/**
 * Calculate the depth of a dead end (how many cells until a junction)
 */
function calculateDeadEndDepth(grid: Cell[][], start: Cell): number {
  let depth = 0;
  let current = start;
  const visited = new Set<string>();
  let iterations = 0;
  const MAX_ITERATIONS = 1000; // Safety limit to prevent infinite loops

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    visited.add(`${current.row},${current.col}`);
    const openings = countOpenings(current);

    // If we hit a junction (more than 2 openings), stop
    if (openings > 2) break;

    // If we're at the start (1 opening), increment depth
    if (openings === 1) {
      depth++;
      // Dead end cell itself - no more to explore
      break;
    } else if (openings === 2) {
      // Continue down the corridor
      depth++;
      const neighbors = getValidNeighbors(grid, current);
      const unvisitedNeighbor = neighbors.find(
        (n) => !visited.has(`${n.row},${n.col}`)
      );
      if (!unvisitedNeighbor) break;
      current = unvisitedNeighbor;
    } else {
      // No openings or dead end, stop
      break;
    }
  }

  return depth;
}

/**
 * Identify all dead ends in the maze
 */
export function identifyDeadEnds(
  grid: Cell[][],
  solutionPath?: Position[],
  end?: Position
): DeadEndInfo[] {
  const deadEnds: DeadEndInfo[] = [];
  const height = grid.length;
  const width = grid[0].length;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = grid[row][col];
      const openings = countOpenings(cell);

      // A dead end has only one opening
      if (openings === 1) {
        const position: Position = { row, col };
        const depth = calculateDeadEndDepth(grid, cell);

        const distanceToEnd = end
          ? Math.abs(row - end.row) + Math.abs(col - end.col)
          : 0;

        let nearSolution = false;
        let distanceAlongSolution: number | undefined;

        if (solutionPath) {
          const { minDistance, nearestIndex } = distanceToPath(position, solutionPath);
          nearSolution = minDistance <= 2;
          distanceAlongSolution = nearestIndex;
        }

        deadEnds.push({
          position,
          depth,
          distanceToEnd,
          nearSolution,
          distanceAlongSolution,
        });
      }
    }
  }

  return deadEnds;
}

/**
 * Get direction from one position to another
 */
function getDirection(from: Position, to: Position): string {
  if (to.row < from.row) return 'up';
  if (to.row > from.row) return 'down';
  if (to.col < from.col) return 'left';
  if (to.col > from.col) return 'right';
  return 'none';
}

/**
 * Calculate solution tortuosity (how winding the path is)
 */
function calculateTortuosity(solutionPath: Position[], start: Position, end: Position): number {
  if (solutionPath.length < 3) return 0;

  // Count direction changes
  let directionChanges = 0;
  for (let i = 1; i < solutionPath.length - 1; i++) {
    const prevDirection = getDirection(solutionPath[i - 1], solutionPath[i]);
    const currentDirection = getDirection(solutionPath[i], solutionPath[i + 1]);
    if (prevDirection !== currentDirection) {
      directionChanges++;
    }
  }

  // Calculate Manhattan distance
  const manhattanDistance = Math.abs(end.row - start.row) + Math.abs(end.col - start.col);

  // Tortuosity: direction changes normalized by straight-line distance
  return manhattanDistance > 0 ? directionChanges / manhattanDistance : 0;
}

/**
 * Calculate complexity score (0-100)
 */
function calculateComplexityScore(
  solutionLength: number,
  tortuosity: number,
  avgDeadEndLength: number,
  decoyDeadEnds: number,
  width: number,
  height: number
): number {
  const maxPossibleLength = width * height;
  const lengthScore = (solutionLength / maxPossibleLength) * 30;
  const tortuosityScore = Math.min(tortuosity * 10, 30);
  const deadEndScore = Math.min(avgDeadEndLength * 4, 25);
  const decoyScore = Math.min(decoyDeadEnds * 2, 15);

  return Math.min(lengthScore + tortuosityScore + deadEndScore + decoyScore, 100);
}

/**
 * Analyze maze quality and return comprehensive metrics
 */
export function analyzeMazeQuality(
  maze: MazeState | EnhancedMazeState,
  solutionPath: Position[]
): MazeQualityMetrics {
  const { grid, width, height, start, end } = maze;

  // Solution length
  const solutionLength = solutionPath.length;

  // Calculate tortuosity
  const solutionTortuosity = calculateTortuosity(solutionPath, start, end);

  // Identify dead ends
  const deadEnds = identifyDeadEnds(grid, solutionPath, end);

  // Calculate dead end metrics
  const averageDeadEndLength =
    deadEnds.length > 0
      ? deadEnds.reduce((sum, de) => sum + de.depth, 0) / deadEnds.length
      : 0;

  const maxDeadEndLength =
    deadEnds.length > 0 ? Math.max(...deadEnds.map((de) => de.depth)) : 0;

  const decoyDeadEnds = deadEnds.filter((de) => de.nearSolution).length;

  // Calculate complexity score
  const complexityScore = calculateComplexityScore(
    solutionLength,
    solutionTortuosity,
    averageDeadEndLength,
    decoyDeadEnds,
    width,
    height
  );

  return {
    solutionLength,
    solutionTortuosity,
    averageDeadEndLength,
    maxDeadEndLength,
    decoyDeadEnds,
    complexityScore,
  };
}
