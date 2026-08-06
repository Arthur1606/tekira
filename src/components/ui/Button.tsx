import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
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
  const baseStyles = 'inline-flex justify-center items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 focus:ring-indigo-500/50 shadow-sm border border-indigo-500/20',
    secondary: 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 hover:bg-zinc-700 hover:text-white hover:-translate-y-0.5 focus:ring-zinc-700/50 shadow-sm backdrop-blur-sm',
    danger: 'bg-rose-600/90 text-white hover:bg-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 focus:ring-rose-500/50 border border-rose-500/20',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:ring-zinc-800/50'
  };

  const width = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || isLoading;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
