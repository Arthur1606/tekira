'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { transferStockAction, InventoryLocation } from '@/modules/inventory/locations';
import { Product } from '@/modules/inventory/types';
import { ArrowRightLeft, X, ArrowRight } from 'lucide-react';

interface TransferStockModalProps {
  locations: InventoryLocation[];
  products: Product[];
}

export function TransferStockModal({ locations, products }: TransferStockModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Extraer todas las variantes de todos los productos
  const allVariants = products.flatMap(p => 
    (p.variants || []).map(v => ({
      id: v.id,
      name: `${p.name} - ${v.name} (${v.sku || 'Sin SKU'})`,
      quantity: v.quantity
    }))
  );

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-2 px-3 h-auto"
      >
        <ArrowRightLeft className="w-4 h-4 mr-1.5 text-indigo-400" /> Transferir Mercancía
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Transferencia de Mercancía</h3>
                  <p className="text-xs text-zinc-400">Mueve existencias entre Bodega y Tienda Principal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={transferStockAction} className="space-y-4">
              
              {/* Origen y Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Ubicación Origen *</label>
                  <select
                    name="from_location_id"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.type === 'warehouse' ? '📦' : '📍'} {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex justify-center text-indigo-400 pt-3 sm:pt-0">
                  <ArrowRight className="w-5 h-5 rotate-90 sm:rotate-0" />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Ubicación Destino *</label>
                  <select
                    name="to_location_id"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.type === 'store' ? '📍' : '📦'} {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de Variante/Producto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Producto / Variante SKU *
                </label>
                <select
                  name="variant_id"
                  required
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-xs font-mono text-zinc-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar variante --</option>
                  {allVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Saldo: {v.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                id="quantity"
                name="quantity"
                type="number"
                label="Cantidad a Transferir *"
                placeholder="Ej. 10"
                min={1}
                required
              />

              <Input
                id="notes"
                name="notes"
                type="text"
                label="Notas u Observaciones (Opcional)"
                placeholder="Ej. Abastecimiento para jornada de ventas"
              />

              <div className="pt-4 flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 text-xs py-3"
                >
                  Cancelar
                </Button>
                <SubmitButton fullWidth className="w-1/2 py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                  Confirmar Transferencia
                </SubmitButton>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
