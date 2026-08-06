'use client';

import { Search } from 'lucide-react';

interface InventorySearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function InventorySearchFilter({ searchTerm, onSearchChange }: InventorySearchFilterProps) {
  return (
    <div className="relative w-full sm:w-72">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por Nombre o SKU..."
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
      />
      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
    </div>
  );
}
