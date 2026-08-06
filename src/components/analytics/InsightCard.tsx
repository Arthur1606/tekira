import React from 'react';
import { Card } from '@/components/ui/Card';
import { Insight } from '@/modules/insights/types';
import { Wallet, Lock, TrendingUp, TrendingDown, AlertTriangle, Moon, Minus, Lightbulb, Package, DollarSign } from 'lucide-react';

const iconsMap: Record<string, React.ElementType> = {
  'wallet': Wallet,
  'lock': Lock,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert-triangle': AlertTriangle,
  'sleep': Moon,
  'minus': Minus,
  'package': Package,
  'dollar-sign': DollarSign
};

const categoryIcons: Record<string, React.ElementType> = {
  'finance': TrendingUp,
  'inventory': Package,
  'cash': Wallet
};

interface InsightCardProps {
  insight: Insight;
  delayMs?: number;
}

export function InsightCard({ insight, delayMs = 0 }: InsightCardProps) {
  
  const typeStyles = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-900/5',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-900/5',
    critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-900/5',
    neutral: 'bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/30 shadow-[#556B2F]/10'
  };

  const currentStyle = typeStyles[insight.type];
  const Icon = iconsMap[insight.icon] || Lightbulb;
  const CategoryIcon = categoryIcons[insight.category] || Lightbulb;

  return (
    <div style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }} className="animate-in fade-in slide-in-from-bottom-4">
      <Card 
        fullHeight
        className="gap-4 group hover:bg-[#19201C] transition-all duration-300 relative overflow-hidden"
      >
        <div className={`absolute -bottom-4 -right-4 p-2 opacity-5 z-0 pointer-events-none transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-700 ${currentStyle.replace('bg-', 'text-').split(' ')[1]}`}>
          <CategoryIcon className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform ${currentStyle} group-hover:scale-105 duration-300`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{insight.category}</p>
              <h4 className="text-base font-bold text-[#F5F5F0] tracking-tight">{insight.title}</h4>
            </div>
          </div>
          
          <div className="mb-6 flex-grow">
            <p className="text-xs font-medium text-zinc-400 leading-relaxed pr-2">{insight.description}</p>
          </div>
          
          <div className="pt-4 border-t border-[#232C26] mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-[#7C9A42] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-[#7C9A42]" /> Acción Sugerida
              </span>
              <span className="text-xs font-bold text-[#8EA653]">Ver detalles y accionar</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
