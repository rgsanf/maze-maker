import type {
  Cell,
  MazeState,
  Position,
  EnhancedMazeState,
  PlacementStrategy,
  MazeGenerationConfig,
  DifficultyPreset,
  Difficulty,
} from './maze-types';
import { findShortestPath, analyzeMazeQuality, identifyDeadEnds } from './maze-analysis';
import { enhanceMaze } from './maze-enhancement';

/**
 * Initialize a grid with all walls intact
 */
function initializeGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];

  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      grid[row][col] = {
        row,
        col,
        walls: {
          top: true,
          right: true,
          bottom: true,
          left: true,
        },
        visited: false,
      };
    }
  }

  return grid;
}

/**
 * Get unvisited neighbors of a cell
 */
function getUnvisitedNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const { row, col } = cell;
  const height = grid.length;
  const width = grid[0].length;

  // Top neighbor
  if (row > 0 && !grid[row - 1][col].visited) {
    neighbors.push(grid[row - 1][col]);
  }

  // Right neighbor
  if (col < width - 1 && !grid[row][col + 1].visited) {
    neighbors.push(grid[row][col + 1]);
  }

  // Bottom neighbor
  if (row < height - 1 && !grid[row + 1][col].visited) {
    neighbors.push(grid[row + 1][col]);
  }

  // Left neighbor
  if (col > 0 && !grid[row][col - 1].visited) {
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

  if (rowDiff === 1) {
    // cell2 is below cell1
    cell1.walls.bottom = false;
    cell2.walls.top = false;
  } else if (rowDiff === -1) {
    // cell2 is above cell1
    cell1.walls.top = false;
    cell2.walls.bottom = false;
  } else if (colDiff === 1) {
    // cell2 is right of cell1
    cell1.walls.right = false;
    cell2.walls.left = false;
  } else if (colDiff === -1) {
    // cell2 is left of cell1
    cell1.walls.left = false;
    cell2.walls.right = false;
  }
}

/**
 * Carve maze using recursive backtracking (DFS)
 */
function carveMaze(grid: Cell[][], start: Position): void {
  const stack: Cell[] = [];
  const startCell = grid[start.row][start.col];

  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisitedNeighbors = getUnvisitedNeighbors(grid, current);

    if (unvisitedNeighbors.length > 0) {
      // Choose random unvisited neighbor
      const randomIndex = Math.floor(Math.random() * unvisitedNeighbors.length);
      const chosen = unvisitedNeighbors[randomIndex];

      // Remove wall between current and chosen
      removeWall(current, chosen);

      // Mark chosen as visited and push to stack
      chosen.visited = true;
      stack.push(chosen);
    } else {
      // No unvisited neighbors, backtrack
      stack.pop();
    }
  }
}

/**
 * Select start position on top or left edge
 */
function selectOppositeEdges(width: number, height: number): { start: Position; end: Position } {
  const startOnTop = Math.random() < 0.5;

  const start: Position = startOnTop
    ? { row: 0, col: Math.floor(Math.random() * width) }
    : { row: Math.floor(Math.random() * height), col: 0 };

  const end: Position = startOnTop
    ? { row: height - 1, col: Math.floor(Math.random() * width) }
    : { row: Math.floor(Math.random() * height), col: width - 1 };

  return { start, end };
}

/**
 * Select random positions in opposite quadrants
 */
function selectRandomFar(width: number, height: number): { start: Position; end: Position } {
  const minDistance = Math.floor((width + height) * 0.7);

  let start: Position;
  let end: Position;
  let attempts = 0;

  do {
    start = {
      row: Math.floor(Math.random() * height),
      col: Math.floor(Math.random() * width),
    };

    // End in opposite quadrant
    const startQuadRow = start.row < height / 2;
    const startQuadCol = start.col < width / 2;

    const endRowMin = startQuadRow ? Math.floor(height / 2) : 0;
    const endRowMax = startQuadRow ? height : Math.floor(height / 2);
    const endColMin = startQuadCol ? Math.floor(width / 2) : 0;
    const endColMax = startQuadCol ? width : Math.floor(width / 2);

    end = {
      row: Math.floor(endRowMin + Math.random() * (endRowMax - endRowMin)),
      col: Math.floor(endColMin + Math.random() * (endColMax - endColMin)),
    };

    attempts++;
  } while (
    Math.abs(start.row - end.row) + Math.abs(start.col - end.col) < minDistance &&
    attempts < 100
  );

  return { start, end };
}

/**
 * Try multiple start/end combinations and select pair with longest path
 */
function selectMaximumDistance(
  grid: Cell[][],
  width: number,
  height: number
): { start: Position; end: Position } {
  const attempts = 20;
  let bestStart: Position = { row: 0, col: 0 };
  let bestEnd: Position = { row: height - 1, col: width - 1 };
  let maxPathLength = 0;

  for (let i = 0; i < attempts; i++) {
    const start: Position = {
      row: Math.floor(Math.random() * height),
      col: Math.floor(Math.random() * width),
    };

    const end: Position = {
      row: Math.floor(Math.random() * height),
      col: Math.floor(Math.random() * width),
    };

    // Skip if same position
    if (start.row === end.row && start.col === end.col) continue;

    // Test path length
    const testMaze: MazeState = { grid, width, height, start, end };
    const path = findShortestPath(testMaze);

    if (path && path.length > maxPathLength) {
      maxPathLength = path.length;
      bestStart = start;
      bestEnd = end;
    }
  }

  return { start: bestStart, end: bestEnd };
}

/**
 * Select start and end positions based on strategy
 */
function selectStartEndPositions(
  grid: Cell[][],
  width: number,
  height: number,
  strategy: PlacementStrategy
): { start: Position; end: Position } {
  switch (strategy) {
    case 'opposite-edges':
      return selectOppositeEdges(width, height);
    case 'random-far':
      return selectRandomFar(width, height);
    case 'maximum-distance':
      return selectMaximumDistance(grid, width, height);
  }
}

/**
 * Score a maze based on quality metrics
 */
function scoreMaze(maze: EnhancedMazeState, config: MazeGenerationConfig): number {
  if (!maze.metrics) return 0;

  const m = maze.metrics;
  const criteria = config.selectionCriteria;

  return (
    m.solutionTortuosity * criteria.tortuosityWeight +
    m.averageDeadEndLength * criteria.deadEndWeight +
    m.decoyDeadEnds * criteria.decoyWeight +
    (m.solutionLength / (maze.width + maze.height)) * criteria.lengthWeight
  );
}

/**
 * Generate multiple mazes and select the best one
 */
export function generateBestMaze(
  width: number,
  height: number,
  config: MazeGenerationConfig
): EnhancedMazeState {
  console.log(`🎯 Generating maze ${width}x${height}, attempts: ${config.qualityAttempts}`);
  const startTime = performance.now();
  const candidates: EnhancedMazeState[] = [];

  for (let attempt = 0; attempt < config.qualityAttempts; attempt++) {
    console.log(`  Attempt ${attempt + 1}/${config.qualityAttempts}`);
    // Initialize and carve base maze
    const grid = initializeGrid(width, height);
    carveMaze(grid, { row: 0, col: 0 });

    // Reset visited flags
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        grid[row][col].visited = false;
      }
    }

    // Select strategic start/end positions
    const t1 = performance.now();
    const { start, end } = selectStartEndPositions(grid, width, height, config.placementStrategy);
    console.log(`    Placement (${config.placementStrategy}): ${(performance.now() - t1).toFixed(0)}ms`);

    // Create enhanced maze state
    const maze: EnhancedMazeState = {
      grid,
      width,
      height,
      start,
      end,
    };

    // Find solution path
    const solutionPath = findShortestPath(maze);
    if (!solutionPath) continue; // Skip if unsolvable

    maze.solutionPath = solutionPath;
    maze.deadEnds = identifyDeadEnds(grid, solutionPath, end);
    maze.metrics = analyzeMazeQuality(maze, solutionPath);

    // Enhance the maze
    const t2 = performance.now();
    enhanceMaze(maze, config.enhancement);
    console.log(`    Enhancement: ${(performance.now() - t2).toFixed(0)}ms`);

    candidates.push(maze);
  }

  console.log(`✅ Total generation time: ${(performance.now() - startTime).toFixed(0)}ms`);

  // Select best maze
  if (candidates.length === 0) {
    console.error('Failed to generate any valid mazes');
    // Fallback to simple maze
    const grid = initializeGrid(width, height);
    carveMaze(grid, { row: 0, col: 0 });
    return {
      grid,
      width,
      height,
      start: { row: 0, col: 0 },
      end: { row: height - 1, col: width - 1 },
    };
  }

  return candidates.reduce((best, current) => {
    const bestScore = scoreMaze(best, config);
    const currentScore = scoreMaze(current, config);
    return currentScore > bestScore ? current : best;
  });
}

/**
 * Get difficulty configuration preset
 */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyPreset {
  switch (difficulty) {
    case 'easy':
      return {
        dimensions: { width: 10, height: 10 },
        generationConfig: {
          placementStrategy: 'opposite-edges',
          enhancement: {
            deadEndMinLength: 2,
            deadEndExtensions: 0, // Disabled for debugging
            decoyPathCount: 0, // Disabled for debugging
            prioritizeEarlyDeadEnds: true,
          },
          selectionCriteria: {
            tortuosityWeight: 1.0,
            deadEndWeight: 0.5,
            decoyWeight: 0.3,
            lengthWeight: 0.5,
          },
          qualityAttempts: 1,
        },
      };

    case 'medium':
      return {
        dimensions: { width: 15, height: 15 },
        generationConfig: {
          placementStrategy: 'random-far',
          enhancement: {
            deadEndMinLength: 3,
            deadEndExtensions: 0, // Disabled for debugging
            decoyPathCount: 0, // Disabled for debugging
            prioritizeEarlyDeadEnds: true,
          },
          selectionCriteria: {
            tortuosityWeight: 1.5,
            deadEndWeight: 1.0,
            decoyWeight: 0.7,
            lengthWeight: 0.8,
          },
          qualityAttempts: 1,
        },
      };

    case 'hard':
      return {
        dimensions: { width: 20, height: 20 },
        generationConfig: {
          placementStrategy: 'random-far',
          enhancement: {
            deadEndMinLength: 4,
            deadEndExtensions: 0, // Disabled for debugging
            decoyPathCount: 0, // Disabled for debugging
            prioritizeEarlyDeadEnds: true,
          },
          selectionCriteria: {
            tortuosityWeight: 2.0,
            deadEndWeight: 1.5,
            decoyWeight: 1.2,
            lengthWeight: 1.0,
          },
          qualityAttempts: 1,
        },
      };
  }
}

/**
 * Generate a maze for a specific difficulty level
 */
export function generateMazeForDifficulty(difficulty: Difficulty): EnhancedMazeState {
  const preset = getDifficultyConfig(difficulty);
  return generateBestMaze(
    preset.dimensions.width,
    preset.dimensions.height,
    preset.generationConfig
  );
}

/**
 * Generate a maze using recursive backtracking algorithm
 * @deprecated Use generateMazeForDifficulty or generateBestMaze instead
 */
export function generateMaze(width: number, height: number): MazeState {
  // Initialize grid with all walls
  const grid = initializeGrid(width, height);

  // Start carving from top-left corner
  const start: Position = { row: 0, col: 0 };
  carveMaze(grid, start);

  // Set start and end positions
  const end: Position = { row: height - 1, col: width - 1 };

  return {
    grid,
    width,
    height,
    start,
    end,
  };
}

/**
 * Get maze dimensions based on difficulty
 */
export function getDimensionsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): { width: number; height: number } {
  switch (difficulty) {
    case 'easy':
      return { width: 10, height: 10 };
    case 'medium':
      return { width: 15, height: 15 };
    case 'hard':
      return { width: 20, height: 20 };
  }
}
