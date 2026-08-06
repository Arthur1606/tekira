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
    <div className={`bg-[#141A16]/90 backdrop-blur-2xl rounded-3xl border border-[#232C26] shadow-xl shadow-black/60 transition-all duration-300 hover:border-[#7C9A42]/30 hover:shadow-2xl hover:-translate-y-0.5 relative ${heightClass} ${noPadding ? '' : 'p-6 sm:p-8'} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none rounded-3xl z-0" />
      <div className={`relative z-10 ${fullHeight ? 'flex flex-col h-full' : ''}`}>
        {children}
      </div>
    </div>
  );
}
