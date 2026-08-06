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
          <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor={props.id || props.name}>
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 transition-colors focus-within:text-indigo-400">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <input
            className={`block w-full rounded-xl border ${
              error
                ? 'border-red-500/50 focus:ring-red-500/20'
                : 'border-white/[0.08] focus:ring-indigo-500/20 focus:border-indigo-500/50'
            } bg-black/20 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500/70 focus:outline-none focus:ring-4 transition-all shadow-inner hover:border-white/[0.12] ${
              Icon ? 'pl-10' : ''
            } ${className}`}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
