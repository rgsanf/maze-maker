export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  row: number;
  col: number;
}

export interface Walls {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface Cell {
  row: number;
  col: number;
  walls: Walls;
  visited: boolean;
}

export interface MazeState {
  grid: Cell[][];
  width: number;
  height: number;
  start: Position;
  end: Position;
}

export interface PlayerState {
  position: Position;
  path: Position[];
  hasWon: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
