import MazeGame from "@/components/maze-game";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <MazeGame />
    </div>
  );
}
