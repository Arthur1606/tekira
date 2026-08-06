import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor={props.id || props.name}>
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Icon className="h-4 w-4 text-[#7C9A42]" />
            </div>
          )}
          <input
            className={`block w-full rounded-xl border ${
              error
                ? 'border-red-500/50 focus:ring-red-500/20'
                : 'border-[#232C26] focus:ring-[#7C9A42]/30 focus:border-[#7C9A42]'
            } bg-[#0B0F0D]/90 px-4 py-3 text-sm text-[#F5F5F0] placeholder-zinc-500/70 focus:outline-none focus:ring-2 transition-all shadow-inner hover:border-[#7C9A42]/40 ${
              Icon ? 'pl-10' : ''
            } ${className}`}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
