import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-mono font-extrabold tracking-wider border backdrop-blur-sm shadow-sm transition-colors';
  
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    neutral: 'bg-[#19201C] text-zinc-300 border-[#232C26]',
    primary: 'bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/30'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
