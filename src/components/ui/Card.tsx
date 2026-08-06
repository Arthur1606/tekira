import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  fullHeight?: boolean;
}

export function Card({ children, className = '', noPadding = false, fullHeight = false }: CardProps) {
  const heightClass = fullHeight ? 'h-full flex flex-col' : '';
  return (
    <div className={`bg-zinc-950/40 backdrop-blur-2xl rounded-2xl border border-white/[0.02] shadow-2xl shadow-black/40 transition-all duration-300 hover:shadow-indigo-500/5 hover:border-white/[0.05] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 overflow-hidden relative ${heightClass} ${noPadding ? '' : 'p-5 sm:p-7'} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none rounded-2xl z-0" />
      <div className={`relative z-10 ${fullHeight ? 'flex flex-col h-full' : ''}`}>
        {children}
      </div>
    </div>
  );
}
