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
      bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 group-hover:border-indigo-500/40',
      text: 'text-indigo-400',
      cardBg: 'bg-zinc-950 border-indigo-500/20 shadow-lg shadow-indigo-900/10'
    },
    success: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/40',
      text: 'text-emerald-400',
      cardBg: ''
    },
    danger: {
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:border-rose-500/40',
      text: 'text-rose-400',
      cardBg: ''
    },
    default: {
      bg: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 group-hover:border-zinc-600',
      text: 'text-zinc-300',
      cardBg: ''
    }
  };

  const currentVariant = variants[variant];

  if (isMain) {
    return (
      <Card className="justify-between relative overflow-hidden group bg-zinc-950 border-white/[0.03] shadow-2xl p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-indigo-950/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-zinc-400 tracking-widest uppercase">
              {title}
            </p>
          </div>
          <div>
            <h3 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 tracking-tighter drop-shadow-sm">
              {value}
            </h3>
          </div>
          {subtitle && (
            <div className="mt-2 pt-6 border-t border-white/[0.05]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500 font-medium tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
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
    <Card className="relative overflow-hidden group p-6 hover:bg-zinc-900/60 transition-colors" noPadding fullHeight>
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 z-0">
        <Icon className="w-32 h-32" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-center">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className={`text-2xl font-black ${currentVariant.text}`}>{value}</h3>
        {subtitle && <p className="text-xs font-medium text-zinc-500 mt-2 tracking-wide">{subtitle}</p>}
      </div>
    </Card>
  );
}
