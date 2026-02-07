interface WinModalProps {
  isOpen: boolean;
  onPlayAgain: () => void;
}

export function WinModal({ isOpen, onPlayAgain }: WinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 max-w-md w-full border-2 border-zinc-200 dark:border-zinc-700">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">🎉 Congratulations!</h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
            You successfully navigated through the maze!
          </p>
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
