import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  status?: 'success' | 'warning' | 'neutral';
  icon: LucideIcon;
}

export function StatusCard({ title, value, subtitle, status = 'neutral', icon: Icon }: StatusCardProps) {
  
  const statusStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    neutral: 'bg-zinc-800/50 text-zinc-400 border-[#2B372F]'
  };

  const currentStyle = statusStyles[status];

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#141A16] border border-white/[0.03] rounded-xl hover:bg-[#141A16] hover:border-white/[0.05] transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${currentStyle} group-hover:scale-105 duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h3 className="text-lg font-black text-[#F5F5F0] leading-none">{value}</h3>
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col justify-center">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{subtitle.split(' ')[0]}</p>
        <p className="text-xs font-semibold text-zinc-400 mt-0.5">{subtitle.split(' ').slice(1).join(' ')}</p>
      </div>
    </div>
  );
}
