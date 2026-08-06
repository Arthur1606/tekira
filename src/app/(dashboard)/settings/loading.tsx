export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-800/60 rounded-xl"></div>
        <div className="h-4 w-64 bg-zinc-800/40 rounded-lg"></div>
      </div>

      <div className="h-12 w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-xl"></div>

      <div className="h-96 w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl"></div>
    </div>
  );
}
