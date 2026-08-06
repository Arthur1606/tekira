'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { createLocationAction } from '@/modules/inventory/locations';
import { Building, Plus, X, Warehouse } from 'lucide-react';

export function CreateLocationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative text-left my-auto">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Crear Ubicación Física</h3>
              <p className="text-xs text-zinc-400">Registra una tienda, bodega o almacén secundario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors rounded-xl hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={createLocationAction} className="space-y-4">
          <Input
            id="name"
            name="name"
            type="text"
            label="Nombre de la Ubicación *"
            placeholder="Ej. Bodega Norte, Almacén Central"
            icon={Building}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tipo de Ubicación *
            </label>
            <select
              name="type"
              defaultValue="warehouse"
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="store">📍 Tienda / Punto de Venta</option>
              <option value="warehouse">📦 Bodega / Almacén Principal</option>
              <option value="other">🏭 Depósito Secundario</option>
            </select>
          </div>

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
              Guardar Ubicación
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
        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2 px-3 h-auto"
      >
        <Plus className="w-4 h-4 mr-1.5 text-indigo-400" /> Nueva Bodega / Ubicación
      </Button>

      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}
