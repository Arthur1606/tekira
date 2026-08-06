'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, Check, Store, Wallet, Users, ArrowRight } from 'lucide-react';

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  targetHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: '1. Inventario & Bodega con SKU',
    description: 'Controla existencias en tiempo real por cada punto de venta y almacén secundario con SKUs automáticos e inmutables.',
    icon: Store,
    targetHint: 'Usa el menú lateral "Inventario & Bodega" para agregar o transferir productos.'
  },
  {
    id: 2,
    title: '2. Caja Operativa y Transacciones',
    description: 'Registra la apertura de caja diaria con saldo contado, realiza movimientos de venta e ingresos/egresos con cuadre transparente.',
    icon: Wallet,
    targetHint: 'Controla el flujo de dinero desde la tarjeta de Control de Caja en tu Inicio.'
  },
  {
    id: 3,
    title: '3. Gestión de Equipo & Roles',
    description: 'Invita a tu equipo asignando códigos de empleado únicos (ej. TKR-EMP-000001) y permisos por rol (Owner, Admin, Empleado).',
    icon: Users,
    targetHint: 'Administra accesos desde la pestaña "Gestión de Equipo" en Configuraciones.'
  }
];

export function InteractiveTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const isDismissed = localStorage.getItem('tekira_tour_dismissed');
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('tekira_tour_dismissed', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#141A16] border border-[#7C9A42]/40 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Glow background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#556B2F]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232C26] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8EA653] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#8EA653] uppercase tracking-wider">
              Guía de Inicio TEKIRA ({currentStep + 1}/{TOUR_STEPS.length})
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-[#19201C]"
            title="Saltar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#556B2F]/20 border border-[#7C9A42]/30 rounded-xl flex items-center justify-center text-[#8EA653] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-[#F5F5F0] leading-tight">{step.title}</h4>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">{step.description}</p>

          <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] text-[11px] text-[#8EA653] font-mono leading-tight">
            💡 {step.targetHint}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#232C26]">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Saltar tutorial
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] font-bold text-xs rounded-xl transition-all shadow-md shadow-[#556B2F]/20 flex items-center gap-1.5"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}</span>
            {currentStep === TOUR_STEPS.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
