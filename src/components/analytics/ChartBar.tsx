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
    <Card className="w-full flex flex-col h-full bg-[#141A16] border-[#232C26]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#F5F5F0]">{title}</h3>
        {subtitle && <p className="text-xs font-mono font-bold text-zinc-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto pt-4 relative">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
          <div className="w-full h-px bg-[#7C9A42]"></div>
        </div>

        {data.map((point, i) => {
          const heightPercent = `${(point.value / maxValue) * 100}%`;
          const delay = i * 100;
          
          return (
            <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-12 bg-[#19201C] text-[#F5F5F0] text-xs py-1.5 px-3 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-10 border border-[#7C9A42]/30 font-mono font-bold transform scale-95 group-hover:scale-100">
                {formatValue(point.value)}
              </div>
              
              <div className="w-full flex justify-center h-full items-end">
                <div 
                  className="w-full max-w-[28px] bg-gradient-to-t from-[#556B2F]/60 to-[#7C9A42] rounded-t-xl group-hover:from-[#556B2F] group-hover:to-[#8EA653] transition-colors duration-300 relative z-0"
                  style={{ height: heightPercent, minHeight: point.value > 0 ? '8px' : '4px' }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              
              <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400 mt-3 truncate w-full text-center uppercase tracking-wider group-hover:text-zinc-200 transition-colors">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
