'use client';

import { useState } from 'react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { getQuantityStep } from '@/modules/inventory/types';
import { addMovement } from '@/modules/inventory/actions';
import { ArrowUpRight, ArrowDownRight, Package, Edit3, Sliders, Layers, AlertCircle } from 'lucide-react';

interface VariantOption {
  id: string;
  name: string;
  quantity: number;
  sku: string | null;
}

interface MovementFormProps {
  productId: string;
  productUnit: string;
  variants: VariantOption[];
}

export function MovementForm({ productId, productUnit, variants }: MovementFormProps) {
  const [mode, setMode] = useState<'manual' | 'adjustment'>('manual');
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id || '');
  const [type, setType] = useState<'entry' | 'damage' | 'loss' | 'discontinued'>('entry');
  
  const [physicalCount, setPhysicalCount] = useState<string>('');

  const quantityStep = getQuantityStep(productUnit);
  const selectedVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
  const systemQty = selectedVariant ? Number(selectedVariant.quantity) : 0;
  const parsedPhysicalCount = parseFloat(physicalCount);
  const diff = !isNaN(parsedPhysicalCount) ? parsedPhysicalCount - systemQty : 0;

  const getReasonOptions = () => {
    switch (type) {
      case 'entry': return ['Compra', 'Reposición', 'Ingreso inicial', 'Ajuste manual'];
      case 'damage': return ['Producto dañado', 'Defecto de fábrica', 'Daño en almacén'];
      case 'loss': return ['Vencido/Caducado', 'Merma', 'Extravío/Robo'];
      case 'discontinued': return ['Retirado de catálogo', 'Descontinuado'];
      default: return [];
    }
  };

  const reasons = getReasonOptions();

  return (
    <form action={addMovement} className="space-y-6 w-full">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="mode" value={mode} />
      
      {/* Selector de Modo */}
      <div className="flex flex-col sm:flex-row items-stretch p-1.5 bg-[#141A16] border border-[#232C26] rounded-xl gap-1.5 w-full">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === 'manual'
              ? 'bg-zinc-800 text-[#8EA653] border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" /> Movimiento Directo
        </button>

        <button
          type="button"
          onClick={() => setMode('adjustment')}
          className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === 'adjustment'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" /> Ajuste Físico
        </button>
      </div>

      {/* Selector de Variante */}
      {variants.length > 0 && (
        <div className="w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="variant_id">
            Variante Afectada
          </label>
          <div className="relative w-full">
            <select
              id="variant_id"
              name="variant_id"
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              required
              className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all appearance-none"
            >
              {variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.sku ? `(${v.sku})` : ''} — Stock Actual: {v.quantity} {productUnit}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Layers className="w-4 h-4 text-[#8EA653]" />
            </div>
          </div>
        </div>
      )}

      {/* MODO 1: Movimiento Directo */}
      {mode === 'manual' && (
        <div className="space-y-6 w-full">
          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2.5 bg-[#0E1310] p-2 border border-[#232C26] rounded-xl w-full">
              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="entry" 
                  className="peer sr-only" 
                  checked={type === 'entry'}
                  onChange={() => setType('entry')}
                />
                <div className="py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all peer-checked:bg-emerald-500/20 peer-checked:text-emerald-400 peer-checked:border peer-checked:border-emerald-500/40 text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4 shrink-0" /> Entrada
                </div>
              </label>

              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="loss" 
                  className="peer sr-only" 
                  checked={type === 'loss'}
                  onChange={() => setType('loss')}
                />
                <div className="py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all peer-checked:bg-amber-500/20 peer-checked:text-amber-400 peer-checked:border peer-checked:border-amber-500/40 text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2">
                  <ArrowDownRight className="w-4 h-4 shrink-0" /> Merma
                </div>
              </label>

              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="damage" 
                  className="peer sr-only" 
                  checked={type === 'damage'}
                  onChange={() => setType('damage')}
                />
                <div className="py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all peer-checked:bg-rose-500/20 peer-checked:text-rose-400 peer-checked:border peer-checked:border-rose-500/40 text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2">
                  <ArrowDownRight className="w-4 h-4 shrink-0" /> Daño
                </div>
              </label>

              <label className="cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="discontinued" 
                  className="peer sr-only" 
                  checked={type === 'discontinued'}
                  onChange={() => setType('discontinued')}
                />
                <div className="py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all peer-checked:bg-zinc-800 peer-checked:text-zinc-300 peer-checked:border peer-checked:border-[#2B372F] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2">
                  <ArrowDownRight className="w-4 h-4 shrink-0" /> Descont.
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="w-full">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step={quantityStep}
                min={quantityStep}
                label={`Cantidad (${productUnit})`}
                placeholder={quantityStep === '1' ? '1' : '0.00'}
                icon={Package}
                required
              />
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="reason">
                Motivo / Concepto
              </label>
              <div className="relative w-full">
                <select
                  id="reason"
                  name="reason"
                  required
                  className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all appearance-none"
                >
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Edit3 className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: Ajuste de Inventario Físico */}
      {mode === 'adjustment' && (
        <div className="space-y-5 bg-zinc-900/50 p-5 rounded-2xl border border-amber-500/20 w-full">
          <div className="flex items-start gap-3 text-amber-400 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ingresa el <strong>conteo físico real</strong>. TEKIRA calculará automáticamente la diferencia con el stock del sistema ({systemQty} {productUnit}) y registrará el ajuste.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end w-full">
            <div className="w-full">
              <Input
                id="physical_count"
                name="physical_count"
                type="number"
                step={quantityStep}
                min="0"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(e.target.value)}
                label={`Conteo Físico Real (${productUnit})`}
                placeholder={`Ej. ${systemQty}`}
                icon={Package}
                required
              />
            </div>

            <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] flex flex-col justify-center h-[54px] w-full">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Diferencia Calculada</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-lg font-black ${
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-zinc-400'
                }`}>
                  {diff > 0 ? `+${diff}` : diff} {productUnit}
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  {diff > 0 ? '(Sobrante)' : diff < 0 ? '(Faltante)' : '(Sin cambio)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-[#232C26] w-full">
        <SubmitButton fullWidth className="py-3.5 text-base font-bold shadow-lg">
          {mode === 'adjustment' ? 'Aplicar Ajuste Físico' : 'Guardar Movimiento'}
        </SubmitButton>
      </div>
    </form>
  );
}
