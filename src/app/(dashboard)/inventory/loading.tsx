export default function InventoryLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-zinc-800/60 rounded-xl"></div>
          <div className="h-4 w-60 bg-zinc-800/40 rounded-lg"></div>
        </div>
        <div className="h-10 w-44 bg-zinc-800/60 rounded-xl"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="h-28 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
        <div className="h-28 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
        <div className="h-28 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
      </div>

      {/* Filter and Table Skeleton */}
      <div className="space-y-4">
        <div className="h-12 w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl"></div>
        <div className="h-80 w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
      </div>
    </div>
  );
}
