'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { deleteProductAction } from '@/modules/inventory/actions';
import { Product } from '@/modules/inventory/types';
import { Trash2, AlertTriangle, X, ShieldAlert, Hash } from 'lucide-react';

interface DeleteProductModalProps {
  product: Product;
  userRole: 'owner' | 'admin' | 'employee';
}

export function DeleteProductModal({ product, userRole }: DeleteProductModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Únicamente el Propietario (Owner) puede ver y ejecutar la eliminación
  if (userRole !== 'owner') {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
        title="Eliminar producto (Solo Propietario)"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative text-left">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Retirar Producto del Catálogo</h3>
                  <p className="text-xs text-rose-400 font-mono">Acción Exclusiva de Propietario (Soft Delete)</p>
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

            {/* Resumen del Producto */}
            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Producto:</span>
                <span className="font-bold text-zinc-100 text-sm">{product.name}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-zinc-400 flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-indigo-400" /> SKU Principal:</span>
                <span className="font-bold text-indigo-300">{product.sku || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Variantes Registradas:</span>
                <span className="font-mono font-bold text-zinc-200">{product.variants?.length || 1} variantes</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">Stock Actual:</span>
                <span className="font-mono font-black text-amber-400">{product.quantity} unidades</span>
              </div>
            </div>

            {/* Advertencia de Soft Delete */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" /> Retiro Seguro (Soft Delete)
              </p>
              <p className="text-amber-400/80 leading-relaxed">
                Este producto será retirado del catálogo de ventas e inventario activo, pero su historial de ventas, costos y movimientos comerciales permanecerá conservado en auditoría.
              </p>
            </div>

            <form action={deleteProductAction} className="space-y-4">
              <input type="hidden" name="product_id" value={product.id} />

              <Input
                id="delete_reason"
                name="delete_reason"
                type="text"
                label="Motivo de Eliminación *"
                placeholder="Ej. Producto descontinuado por proveedor"
                required
              />

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 text-xs py-3"
                >
                  Cancelar
                </Button>
                <SubmitButton fullWidth className="w-1/2 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20">
                  Confirmar Eliminación
                </SubmitButton>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
