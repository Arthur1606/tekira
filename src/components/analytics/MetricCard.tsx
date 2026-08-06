import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'danger' | 'default';
  isMain?: boolean;
}

export function MetricCard({ title, value, subtitle, icon: Icon, variant = 'default', isMain = false }: MetricCardProps) {
  
  const variants = {
    primary: {
      bg: 'bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/30 group-hover:border-[#7C9A42]/50',
      text: 'text-[#8EA653]',
      cardBg: 'bg-[#141A16] border-[#7C9A42]/30 shadow-lg shadow-black/40'
    },
    success: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
      text: 'text-emerald-400',
      cardBg: ''
    },
    danger: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40',
      text: 'text-rose-400',
      cardBg: ''
    },
    default: {
      bg: 'bg-[#19201C] text-zinc-400 border-[#232C26] group-hover:border-[#7C9A42]/30',
      text: 'text-zinc-200',
      cardBg: ''
    }
  };

  const currentVariant = variants[variant];

  if (isMain) {
    return (
      <Card className="justify-between relative overflow-hidden group bg-[#141A16] border-[#232C26] shadow-2xl p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#556B2F]/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#556B2F]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#556B2F]/20 transition-colors duration-1000"></div>
        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#556B2F]/20 border border-[#7C9A42]/30 flex items-center justify-center text-[#8EA653]">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono font-bold text-zinc-400 tracking-widest uppercase">
              {title}
            </p>
          </div>
          <div>
            <h3 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#F5F5F0] to-zinc-400 tracking-tight drop-shadow-sm">
              {value}
            </h3>
          </div>
          {subtitle && (
            <div className="mt-2 pt-6 border-t border-[#232C26]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 font-medium tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#7C9A42] animate-pulse"></span>
                  {subtitle}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden group p-6 hover:bg-[#19201C] transition-colors" noPadding fullHeight>
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 z-0">
        <Icon className="w-32 h-32 text-[#7C9A42]" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">{title}</p>
        <h3 className={`text-2xl font-black ${currentVariant.text}`}>{value}</h3>
        {subtitle && <p className="text-xs font-medium text-zinc-500 mt-2 tracking-wide">{subtitle}</p>}
      </div>
    </Card>
  );
}
