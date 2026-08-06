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
        className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl py-2 pl-9 pr-4 text-xs text-[#F5F5F0] placeholder-zinc-500 focus:border-[#7C9A42] focus:outline-none transition-all shadow-inner"
      />
      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
    </div>
  );
}
