export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-800/60 rounded-xl"></div>
          <div className="h-4 w-64 bg-zinc-800/40 rounded-lg"></div>
        </div>
        <div className="h-10 w-40 bg-zinc-800/60 rounded-xl"></div>
      </div>

      {/* Control de Caja Skeleton */}
      <div className="h-32 w-full bg-[#141A16] border border-[#232C26] rounded-2xl"></div>

      {/* Grid Métricas Skeleton */}
      <div className="space-y-4">
        <div className="h-36 w-full bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-28 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
          <div className="h-28 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
          <div className="h-28 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
        </div>
      </div>

      {/* Insights Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="h-32 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
        <div className="h-32 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
        <div className="h-32 bg-[#141A16] border border-[#232C26] rounded-2xl"></div>
      </div>
    </div>
  );
}
