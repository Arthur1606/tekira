import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  secondaryActionLabel,
  secondaryActionHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-8 sm:p-12 bg-[#141A16] border border-[#232C26] rounded-3xl text-center flex flex-col items-center justify-center space-y-4 shadow-xl ${className}`}>
      <div className="w-16 h-16 bg-[#556B2F]/20 border border-[#7C9A42]/30 rounded-2xl flex items-center justify-center text-[#8EA653] shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-xl font-extrabold text-[#F5F5F0] tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="px-5 py-2.5 bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#556B2F]/20 flex items-center gap-2"
            >
              {actionLabel}
            </Link>
          )}

          {actionLabel && !actionHref && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="px-5 py-2.5 bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#556B2F]/20 flex items-center gap-2"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="px-4 py-2.5 bg-[#0E1310] hover:bg-[#19201C] text-zinc-300 border border-[#232C26] font-bold text-xs rounded-xl transition-all"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
