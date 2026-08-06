'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Store, Tag } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dollar: DollarSign,
  wallet: Wallet,
  store: Store,
  tag: Tag,
};

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  iconName?: 'dollar' | 'wallet' | 'store' | 'tag';
  error?: string;
  onValueChange?: (value: number) => void;
  defaultValue?: string | number;
}

export function CurrencyInput({
  label,
  iconName = 'dollar',
  error,
  className = '',
  id,
  name,
  required,
  onValueChange,
  defaultValue = '',
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [realValue, setRealValue] = useState<string>('');

  const IconComponent = iconName ? iconMap[iconName] : DollarSign;

  useEffect(() => {
    if (defaultValue) {
      const numStr = defaultValue.toString().replace(/[^0-9]/g, '');
      if (numStr) {
        setRealValue(numStr);
        setDisplayValue(new Intl.NumberFormat('es-CO').format(parseInt(numStr, 10)));
      }
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    
    if (!rawValue) {
      setDisplayValue('');
      setRealValue('');
      if (onValueChange) onValueChange(0);
      return;
    }

    const numberValue = parseInt(rawValue, 10);
    const formattedValue = new Intl.NumberFormat('es-CO').format(numberValue);
    
    setDisplayValue(formattedValue);
    setRealValue(numberValue.toString());
    
    if (onValueChange) {
      onValueChange(numberValue);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor={id}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7C9A42]">
            <IconComponent className="w-4 h-4" />
          </div>
        )}
        
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          className={`
            block w-full rounded-xl border bg-[#0B0F0D]/90 px-4 py-3 text-sm text-[#F5F5F0] placeholder-zinc-500
            focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all shadow-inner
            ${IconComponent ? 'pl-10' : ''}
            ${error 
              ? 'border-red-500/50' 
              : 'border-[#232C26]'
            }
            ${className}
          `}
          placeholder={props.placeholder || '0'}
          required={required}
          {...props}
        />
        
        <input 
          type="hidden" 
          id={id} 
          name={name} 
          value={realValue} 
        />

        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
