'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle, X, Sparkles, BookOpen, ChevronRight, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HELP_CONTENT, HelpModule } from '@/modules/help/helpContent';

export function HelpCenterWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // Determinar el módulo activo según la ruta actual
  const getActiveModuleKey = (path: string): string => {
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/dashboard/purchases')) return 'purchases';
    if (path.startsWith('/dashboard/suppliers')) return 'suppliers';
    if (path.startsWith('/sales') || path.startsWith('/transactions')) return 'sales';
    if (path.startsWith('/team')) return 'team';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const activeKey = getActiveModuleKey(pathname);
  const activeModule: HelpModule = HELP_CONTENT[activeKey] || HELP_CONTENT.dashboard;

  useEffect(() => {
    // Toast no intrusivo de bienvenida primera vez (se oculta automáticamente tras 6s)
    const isToastDismissed = localStorage.getItem('tekira_help_toast_dismissed');
    if (!isToastDismissed) {
      setShowWelcomeToast(true);
      const timer = setTimeout(() => {
        setShowWelcomeToast(false);
        localStorage.setItem('tekira_help_toast_dismissed', 'true');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissToast = () => {
    setShowWelcomeToast(false);
    localStorage.setItem('tekira_help_toast_dismissed', 'true');
  };

  return (
    <>
      {/* Toast No Intrusivo de Primera Vez */}
      {showWelcomeToast && !isOpen && (
        <div className="fixed bottom-20 right-6 z-40 max-w-xs w-full bg-[#141A16] border border-[#7C9A42]/40 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-3 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8EA653] shrink-0" />
              <p className="text-xs font-bold text-[#F5F5F0]">Bienvenido a TEKIRA</p>
            </div>
            <button
              onClick={dismissToast}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
            Usa el botón de ayuda en cualquier momento para consultar tutoriales y guías rápidas.
          </p>
        </div>
      )}

      {/* Botón Flotante Discreto de Ayuda (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3.5 py-2.5 bg-[#141A16] hover:bg-[#19201C] text-[#F5F5F0] border border-[#7C9A42]/40 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#7C9A42] focus:outline-none ring-2 ring-[#0B0F0D]"
          title="Centro de Ayuda Contextual"
        >
          <div className="w-6 h-6 rounded-full bg-[#556B2F]/30 text-[#8EA653] flex items-center justify-center border border-[#7C9A42]/40 group-hover:bg-[#556B2F] group-hover:text-white transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#F5F5F0] pr-1">Ayuda</span>
        </button>
      </div>

      {/* Drawer / Panel Lateral de Ayuda Contextual */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop Transparente */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          {/* Panel Lateral Flotante */}
          <div className="relative w-full max-w-md bg-[#141A16] border-l border-[#232C26] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            {/* Header del Panel */}
            <div className="p-6 border-b border-[#232C26] bg-[#0E1310] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#556B2F]/20 text-[#8EA653] rounded-xl flex items-center justify-center border border-[#7C9A42]/30 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#F5F5F0]">Centro de Ayuda TEKIRA</h3>
                  <span className="text-[10px] font-mono text-[#8EA653] uppercase tracking-wider">
                    Sección: {activeModule.category}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-xl hover:bg-[#19201C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Contextual */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Card Resumen de la Sección */}
              <div className="p-4 bg-[#0E1310] border border-[#232C26] rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-[#F5F5F0] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8EA653]" />
                  {activeModule.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {activeModule.description}
                </p>
              </div>

              {/* Pasos / Guía Rápida */}
              <div className="space-y-4">
                <h5 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  Pasos de Operación Recomendados
                </h5>

                <div className="space-y-3">
                  {activeModule.steps.map((step, idx) => (
                    <div key={idx} className="p-4 bg-[#0E1310]/70 border border-[#232C26] rounded-2xl space-y-1.5 hover:border-[#7C9A42]/30 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#556B2F]/20 text-[#8EA653] text-[10px] font-mono font-bold flex items-center justify-center border border-[#7C9A42]/30">
                          {idx + 1}
                        </span>
                        <h6 className="text-xs font-bold text-[#F5F5F0]">{step.title}</h6>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed pl-7">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enlaces Rápidos */}
              {activeModule.quickLinks && activeModule.quickLinks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                    Accesos Rápidos
                  </h5>
                  <div className="flex flex-col gap-2">
                    {activeModule.quickLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-3 bg-[#19201C] hover:bg-[#556B2F]/20 border border-[#232C26] hover:border-[#7C9A42]/30 rounded-xl text-xs font-bold text-zinc-200 hover:text-[#F5F5F0] transition-colors group"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#7C9A42] group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Todos los módulos disponibles */}
              <div className="pt-4 border-t border-[#232C26] space-y-3">
                <h5 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  Otras Secciones de Ayuda
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.values(HELP_CONTENT).map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        // Navegación rápida dentro del help drawer
                      }}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all text-[11px] truncate ${
                        mod.id === activeKey
                          ? 'bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40'
                          : 'bg-[#0E1310] text-zinc-400 border-[#232C26] hover:text-zinc-200'
                      }`}
                    >
                      {mod.title.split(' ')[0]} {mod.title.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer del Panel */}
            <div className="p-4 border-t border-[#232C26] bg-[#0E1310] text-center">
              <span className="text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7C9A42]" /> TEKIRA Enterprise Help Center v0.12.0
              </span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
