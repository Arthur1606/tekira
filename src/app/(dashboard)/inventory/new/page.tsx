'use client';

import { useState } from 'react';
import { createProduct } from '@/modules/inventory/actions';
import { Card } from '@/components/ui/Card';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { PRODUCT_UNITS, PRODUCT_CATEGORIES, getQuantityStep } from '@/modules/inventory/types';
import { ArrowLeft, Box, Tag, Layers, DollarSign, AlertTriangle, Barcode } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function NewProductPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const [selectedUnit, setSelectedUnit] = useState<string>('unidades');
  const quantityStep = getQuantityStep(selectedUnit);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nuevo Producto</h1>
          <p className="text-sm text-zinc-400">Agrega un artículo al inventario del comercio</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{success}</p>
          </div>
        )}

        <form action={createProduct} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              id="name"
              name="name"
              type="text"
              label="Nombre del Producto"
              placeholder="Ej. Sudadera Negra M"
              icon={Box}
              required
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="category">
                Categoría
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue=""
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 pl-10 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none capitalize"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            
            <Input
              id="sku"
              name="sku"
              type="text"
              label="SKU / Código (Opcional)"
              placeholder="Ej. SUD-NEG-M"
              icon={Barcode}
            />
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-100 mb-4">Stock Inicial y Medida</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="w-full">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="unit">
                  Unidad de Medida
                </label>
                <div className="relative">
                  <select
                    id="unit"
                    name="unit"
                    required
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 pl-10 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none capitalize"
                  >
                    {PRODUCT_UNITS.map(unit => (
                      <option key={unit} value={unit} className="capitalize">{unit}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <Input
                id="quantity"
                name="quantity"
                type="number"
                step={quantityStep}
                min="0"
                label={`Cantidad Inicial (${selectedUnit})`}
                placeholder="0"
                required
              />

              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                step={quantityStep}
                min="0"
                label="Stock Mínimo (Alerta)"
                placeholder="5"
                icon={AlertTriangle}
                defaultValue="5"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-100 mb-4">Finanzas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CurrencyInput
                id="cost"
                name="cost"
                label="Costo (Opcional)"
                placeholder="0"
                icon={DollarSign}
                defaultValue="0"
              />

              <CurrencyInput
                id="sale_price"
                name="sale_price"
                label="Precio de Venta"
                placeholder="0"
                icon={DollarSign}
                required
                className="font-bold text-indigo-400"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <SubmitButton fullWidth className="py-3 text-base">
              Guardar Producto
            </SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
