import React from 'react';
import { Card } from '@/components/ui/Card';

interface DataPoint {
  label: string;
  value: number;
}

interface ChartBarProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  formatValue?: (val: number) => string;
}

export function ChartBar({ data, title, subtitle, formatValue = (v) => v.toString() }: ChartBarProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card className="w-full flex flex-col h-full bg-[#141A16] border-[#232C26] p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#F5F5F0] tracking-tight">{title}</h3>
        {subtitle && <p className="text-[11px] font-mono font-bold text-zinc-400 mt-0.5 uppercase tracking-wider">{subtitle}</p>}
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-3 h-56 sm:h-64 mt-auto pt-10 pb-2 relative">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 top-10 bottom-8 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
        </div>

        {data.map((point, i) => {
          const heightPercent = `${Math.max(4, Math.round((point.value / maxValue) * 100))}%`;
          const delay = i * 80;
          
          return (
            <div 
              key={i} 
              className="flex flex-col items-center flex-1 group relative h-full justify-end animate-in slide-in-from-bottom-6 fade-in duration-500" 
              style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
            >
              {/* Tooltip elegante al hacer hover (no colisiona con el encabezado) */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-0 bg-[#0E1310] text-[#F5F5F0] text-[11px] py-1.5 px-3 rounded-xl whitespace-nowrap shadow-2xl pointer-events-none z-20 border border-[#7C9A42]/40 font-mono font-bold transform -translate-y-2 group-hover:translate-y-0 shadow-[#556B2F]/20">
                <span className="text-[#8EA653] block text-[9px] uppercase tracking-wider">{point.label}</span>
                {formatValue(point.value)}
              </div>
              
              {/* Barra Vertical */}
              <div className="w-full flex justify-center h-full items-end pt-6">
                <div 
                  className="w-full max-w-[32px] bg-gradient-to-t from-[#556B2F]/70 to-[#7C9A42] rounded-t-xl group-hover:from-[#556B2F] group-hover:to-[#8EA653] transition-all duration-300 relative z-10 group-hover:shadow-[0_0_12px_rgba(124,154,66,0.3)]"
                  style={{ height: heightPercent }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Etiqueta del Eje X */}
              <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 mt-3 truncate w-full text-center uppercase tracking-wider group-hover:text-[#8EA653] transition-colors">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
