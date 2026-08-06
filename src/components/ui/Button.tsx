import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex justify-center items-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F0D] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';
  
  const variants = {
    primary: 'bg-[#556B2F] text-[#F5F5F0] hover:bg-[#7C9A42] shadow-lg shadow-[#556B2F]/20 hover:shadow-[#7C9A42]/30 hover:-translate-y-0.5 focus:ring-[#7C9A42]/50 border border-[#7C9A42]/30',
    secondary: 'bg-[#141A16] text-[#F5F5F0] border border-[#232C26] hover:bg-[#19201C] hover:border-[#7C9A42]/40 hover:-translate-y-0.5 focus:ring-zinc-700/50 shadow-sm',
    danger: 'bg-rose-600/90 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 focus:ring-rose-500/50 border border-rose-500/20',
    ghost: 'text-zinc-400 hover:text-[#F5F5F0] hover:bg-[#141A16] focus:ring-[#141A16]'
  };

  const width = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || isLoading;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#F5F5F0]" />}
      {children}
    </button>
  );
}
