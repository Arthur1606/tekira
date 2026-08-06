'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Building, Warehouse, Users, Package, Lock, ChevronDown, ChevronUp, Plus, ShoppingCart } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
  icon: any;
}

interface PilotOnboardingGuideProps {
  hasStoreInfo: boolean;
  locationsCount: number;
  teamCount: number;
  productsCount: number;
  isCashOpen: boolean;
}

export function PilotOnboardingGuide({
  hasStoreInfo,
  locationsCount,
  teamCount,
  productsCount,
  isCashOpen
}: PilotOnboardingGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'step1',
      title: 'Paso 1: Información Empresa',
      description: 'Configura teléfono, correo institucional, moneda y dirección.',
      href: '/settings?tab=company',
      isCompleted: hasStoreInfo,
      icon: Building
    },
    {
      id: 'step2',
      title: 'Paso 2: Ubicaciones / Bodegas',
      description: 'Crea tus tiendas físicas y bodegas de almacenamiento.',
      href: '/inventory',
      isCompleted: locationsCount >= 2,
      icon: Warehouse
    },
    {
      id: 'step3',
      title: 'Paso 3: Crear Empleados',
      description: 'Asigna códigos de empleado únicos y roles a tu personal.',
      href: '/settings?tab=team',
      isCompleted: teamCount >= 2,
      icon: Users
    },
    {
      id: 'step4',
      title: 'Paso 4: Primeros Productos',
      description: 'Construye tu catálogo con SKU automático inmutable.',
      href: '/inventory/new',
      isCompleted: productsCount >= 1,
      icon: Package
    },
    {
      id: 'step5',
      title: 'Paso 5: Abrir Primera Caja',
      description: 'Registra el dinero inicial para comenzar operaciones.',
      href: '/dashboard',
      isCompleted: isCashOpen,
      icon: Lock
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-[#141A16]/95 border border-[#7C9A42]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* Decorative Glow */}
      <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-[#556B2F]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Widget - Estado Inteligente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232C26] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#556B2F]/20 text-[#8EA653] rounded-2xl flex items-center justify-center border border-[#7C9A42]/30 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-[#F5F5F0]">
                {completedCount === steps.length ? '¡Tu empresa está 100% lista para operar!' : 'Configuración Inicial del Negocio'}
              </h3>
              <span className="bg-[#556B2F]/20 text-[#8EA653] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#7C9A42]/30">
                {progressPercentage}% Listo
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Sigue estos 5 pasos para dejar tu comercio listo para pruebas piloto y operación real.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-zinc-400 hover:text-[#F5F5F0] transition-colors rounded-xl hover:bg-[#19201C] self-end sm:self-auto"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Barra de Progreso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Configuración inicial:</span>
          <span className="text-[#8EA653] font-bold">{completedCount} de {steps.length} completados</span>
        </div>
        <div className="w-full bg-[#0E1310] h-3 rounded-full overflow-hidden border border-[#232C26]">
          <div 
            className="bg-gradient-to-r from-[#556B2F] to-[#7C9A42] h-full transition-all duration-700 ease-out rounded-full shadow-sm shadow-[#7C9A42]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Accesos Rápidos de Acción */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mr-1">Acciones Rápidas:</span>
        
        <Link
          href="/inventory/new"
          className="px-3 py-1.5 bg-[#556B2F]/20 hover:bg-[#556B2F]/30 text-[#8EA653] border border-[#7C9A42]/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#7C9A42]" /> Crear Producto
        </Link>

        <Link
          href="/settings?tab=team"
          className="px-3 py-1.5 bg-[#556B2F]/20 hover:bg-[#556B2F]/30 text-[#8EA653] border border-[#7C9A42]/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#7C9A42]" /> Agregar Empleado
        </Link>

        <Link
          href="/dashboard/purchases/new"
          className="px-3 py-1.5 bg-[#141A16] hover:bg-[#19201C] text-zinc-300 border border-[#232C26] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" /> Registrar Compra
        </Link>
      </div>

      {/* Stepper Body */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 group min-h-[165px] ${
                  step.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#0E1310]/80 border-[#232C26] hover:border-[#7C9A42]/40 text-zinc-300 hover:bg-[#19201C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${
                    step.isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-[#141A16] border-[#232C26] text-zinc-400 group-hover:text-[#7C9A42]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {step.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-amber-500/80 group-hover:text-[#7C9A42] shrink-0" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold leading-tight text-[#F5F5F0]">{step.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug line-clamp-2">{step.description}</p>
                </div>

                <div className="flex items-center text-[10px] font-bold text-[#8EA653] group-hover:text-[#7C9A42] pt-1 uppercase tracking-wider">
                  <span>{step.isCompleted ? '✓ Listo' : '⚠ Configurar'}</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
