import type { Cell, MazeState, Position } from './maze-types';

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
 * Generate a maze using recursive backtracking algorithm
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
