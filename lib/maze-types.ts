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

// Enhanced maze generation types
export type PlacementStrategy = 'opposite-corners' | 'opposite-edges' | 'random-far' | 'maximum-distance';

export interface MazeQualityMetrics {
  solutionLength: number;
  solutionTortuosity: number;
  averageDeadEndLength: number;
  maxDeadEndLength: number;
  decoyDeadEnds: number;
  complexityScore: number;
}

export interface DeadEndInfo {
  position: Position;
  depth: number;
  distanceToEnd: number;
  nearSolution: boolean;
  distanceAlongSolution?: number;
}

export interface EnhancedMazeState extends MazeState {
  solutionPath?: Position[];
  metrics?: MazeQualityMetrics;
  deadEnds?: DeadEndInfo[];
}

export interface EnhancementConfig {
  deadEndMinLength: number;
  deadEndExtensions: number;
  decoyPathCount: number;
  prioritizeEarlyDeadEnds: boolean;
}

export interface SelectionCriteria {
  tortuosityWeight: number;
  deadEndWeight: number;
  decoyWeight: number;
  lengthWeight: number;
}

export interface MazeGenerationConfig {
  placementStrategy: PlacementStrategy;
  enhancement: EnhancementConfig;
  selectionCriteria: SelectionCriteria;
  qualityAttempts: number;
}

export interface DifficultyPreset {
  dimensions: { width: number; height: number };
  generationConfig: MazeGenerationConfig;
}
