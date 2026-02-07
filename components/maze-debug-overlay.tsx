import type { EnhancedMazeState } from "@/lib/maze-types";
import { cn } from "@/lib/utils";

interface MazeDebugOverlayProps {
  maze: EnhancedMazeState;
  visible: boolean;
  onToggle: () => void;
}

export function MazeDebugOverlay({
  maze,
  visible,
  onToggle,
}: MazeDebugOverlayProps) {
  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={onToggle}
          className="px-4 py-2 text-sm font-medium rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          Show Debug Info
        </button>
      </div>
    );
  }

  const { solutionPath, deadEnds, metrics } = maze;

  // Helper: Check if position is on solution path
  const isOnSolution = (row: number, col: number): boolean => {
    return solutionPath?.some((p) => p.row === row && p.col === col) ?? false;
  };

  // Helper: Get dead end at position
  const getDeadEnd = (row: number, col: number) => {
    return deadEnds?.find(
      (de) => de.position.row === row && de.position.col === col
    );
  };

  // Helper: Get dead end color based on depth
  const getDeadEndColor = (depth: number): string => {
    if (depth <= 2) return "bg-orange-300/40"; // Shallow
    if (depth <= 5) return "bg-orange-500/40"; // Medium
    return "bg-red-500/40"; // Deep
  };

  return (
    <>
      {/* Debug Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full max-w-2xl mx-auto p-4">
          <div
            className="grid gap-0 border-4 border-transparent"
            style={{
              gridTemplateColumns: `repeat(${maze.width}, 1fr)`,
            }}
          >
            {maze.grid.map((row) =>
              row.map((cell) => {
                const isSolution = isOnSolution(cell.row, cell.col);
                const deadEnd = getDeadEnd(cell.row, cell.col);

                return (
                  <div
                    key={`debug-${cell.row}-${cell.col}`}
                    className={cn(
                      "aspect-square relative",
                      isSolution && "bg-green-500/30",
                      deadEnd && !isSolution && getDeadEndColor(deadEnd.depth)
                    )}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Metrics Panel */}
      <div className="fixed top-4 right-4 pointer-events-auto z-50">
        <div className="p-4 w-80 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Debug Metrics</h3>
            <button
              onClick={onToggle}
              className="px-3 py-1 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Hide
            </button>
          </div>

          {metrics ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solution Length:</span>
                <span className="font-medium">
                  {metrics.solutionLength} cells
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Tortuosity:</span>
                <span className="font-medium">
                  {metrics.solutionTortuosity.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Dead End:</span>
                <span className="font-medium">
                  {metrics.averageDeadEndLength.toFixed(1)} cells
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Dead End:</span>
                <span className="font-medium">
                  {metrics.maxDeadEndLength} cells
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Decoy Paths:</span>
                <span className="font-medium">{metrics.decoyDeadEnds}</span>
              </div>

              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground font-semibold">
                  Complexity Score:
                </span>
                <span className="font-bold">
                  {metrics.complexityScore.toFixed(1)}/100
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No metrics available
            </p>
          )}

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-xs font-semibold mb-2">Legend:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/30 border border-gray-300" />
                <span>Solution Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-300/40 border border-gray-300" />
                <span>Shallow Dead End (1-2 cells)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500/40 border border-gray-300" />
                <span>Medium Dead End (3-5 cells)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/40 border border-gray-300" />
                <span>Deep Dead End (6+ cells)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
