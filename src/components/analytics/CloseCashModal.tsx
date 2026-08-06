'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { closeCashRegister } from '@/modules/transactions/actions';
import { Lock, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CloseCashModalProps {
  openingId: string;
  initialAmount: number;
  incomeAmount: number;
  expenseAmount: number;
  expectedAmount: number;
}

export function CloseCashModal({
  openingId,
  initialAmount,
  incomeAmount,
  expenseAmount,
  expectedAmount
}: CloseCashModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [countedAmountStr, setCountedAmountStr] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedCounted = parseFloat(countedAmountStr) || 0;
  const difference = parsedCounted - expectedAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141A16] border border-[#232C26] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#232C26] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#F5F5F0]">Cierre de Caja Operativa</h3>
              <p className="text-xs text-zinc-400">Verifica el balance y confirma el dinero físico contado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-400 hover:text-[#F5F5F0] hover:bg-[#19201C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Financiero de la Jornada */}
        <div className="bg-[#0E1310] p-4 rounded-2xl border border-[#232C26] space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider block">Resumen de la Jornada</span>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#141A16] rounded-xl border border-[#232C26]">
              <span className="text-zinc-400">Caja Inicial</span>
              <span className="font-bold text-zinc-200">{formatCurrency(initialAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#141A16] rounded-xl border border-[#232C26]">
              <span className="text-zinc-400">Ingresos (+)</span>
              <span className="font-bold text-emerald-400">+{formatCurrency(incomeAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#141A16] rounded-xl border border-[#232C26]">
              <span className="text-zinc-400">Egresos (-)</span>
              <span className="font-bold text-rose-400">-{formatCurrency(expenseAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-[#556B2F]/20 rounded-xl border border-[#7C9A42]/30">
              <span className="text-[#8EA653] font-bold">Caja Esperada</span>
              <span className="font-black text-[#F5F5F0]">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>
        </div>

        {/* Formulario de Cierre */}
        <form action={closeCashRegister} className="space-y-6">
          <input type="hidden" name="opening_id" value={openingId} />
          <input type="hidden" name="expected_amount" value={expectedAmount} />

          <CurrencyInput
            id="counted_amount"
            name="counted_amount"
            label="Digite Dinero Contado en Caja"
            placeholder="0"
            iconName="dollar"
            value={countedAmountStr}
            onValueChange={(val) => setCountedAmountStr(val.toString())}
            required
            className="text-xl font-black text-[#F5F5F0]"
          />

          {/* Tarjeta de Diferencia Calculada */}
          {countedAmountStr !== '' && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              difference === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : difference > 0
                ? 'bg-[#556B2F]/20 border-[#7C9A42]/30 text-[#8EA653]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {difference === 0 ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                )}
                <span>
                  {difference === 0
                    ? 'Cuadre Perfecto'
                    : difference > 0
                    ? 'Sobrante en Caja'
                    : 'Faltante en Caja'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-lg font-black block">
                  {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
                </span>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-[#232C26] flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-xs font-bold"
            >
              Cancelar
            </Button>
            <SubmitButton className="px-6 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg">
              Confirmar Cierre de Caja
            </SubmitButton>
          </div>
        </form>

      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="bg-[#141A16] hover:bg-[#19201C] text-[#F5F5F0] border border-[#232C26] text-xs font-bold px-3.5 py-2 h-auto rounded-xl flex items-center gap-1.5"
      >
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        <span>Cerrar Caja</span>
      </Button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
