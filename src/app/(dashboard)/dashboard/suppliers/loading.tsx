export default function SuppliersLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-zinc-800/60 rounded-xl"></div>
          <div className="h-4 w-56 bg-zinc-800/40 rounded-lg"></div>
        </div>
        <div className="h-10 w-44 bg-zinc-800/60 rounded-xl"></div>
      </div>

      <div className="h-72 w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
    </div>
  );
}
