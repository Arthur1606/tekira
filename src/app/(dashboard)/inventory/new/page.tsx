'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/modules/inventory/actions';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Package, Tag, Layers, AlertCircle, Plus, Hash } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  'General', 'Bebidas', 'Alimentos', 'Abarrotes', 'Limpieza', 
  'Cuidado Personal', 'Lácteos', 'Panadería', 'Carnes', 'Frutas y Verduras', 
  'Snacks', 'Dulcería', 'Licores', 'Cigarrillos', 'Hogar', 'Mascotas', 'Otro'
];

const UNITS = [
  'unidad', 'kg', 'g', 'lb', 'l', 'ml', 'paquete', 'caja', 'botella', 'lata', 'porción'
];

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('unidad');

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-zinc-950/40 backdrop-blur-2xl rounded-2xl border border-white/[0.03]">
        <div className="flex items-center gap-4">
          <Link href="/inventory" className="p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Nuevo Producto</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1">Registra un nuevo artículo en tu catálogo</p>
          </div>
        </div>
      </div>

      <Card noPadding className="p-6 sm:p-8 max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form action={createProduct} className="space-y-6">
          
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-100 mb-4">Información Básica</h3>
            
            <Input
              id="name"
              name="name"
              type="text"
              label="Nombre del Producto *"
              placeholder="Ej. Arroz Diana 1kg"
              icon={Package}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="category">
                  Categoría
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    defaultValue="General"
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Tag className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              <Input
                id="sku"
                name="sku"
                type="text"
                label="Código SKU (Opcional)"
                placeholder="Ej. ARR-0001 (Auto-generado si está vacío)"
                icon={Hash}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-100 mb-4">Inventario e Insumos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="unit">
                  Unidad de Medida
                </label>
                <div className="relative">
                  <select
                    id="unit"
                    name="unit"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none capitalize"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              <Input
                id="quantity"
                name="quantity"
                type="number"
                step={['kg', 'g', 'lb', 'l', 'ml'].includes(selectedUnit) ? '0.01' : '1'}
                min="0"
                label={`Stock Inicial (${selectedUnit})`}
                placeholder="0"
                icon={Package}
                defaultValue="0"
              />

              <Input
                id="min_stock"
                name="min_stock"
                type="number"
                step={['kg', 'g', 'lb', 'l', 'ml'].includes(selectedUnit) ? '0.01' : '1'}
                min="0"
                label={`Stock Mínimo Alerta (${selectedUnit})`}
                placeholder="5"
                icon={Package}
                defaultValue="5"
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
                iconName="dollar"
                defaultValue="0"
              />

              <CurrencyInput
                id="sale_price"
                name="sale_price"
                label="Precio de Venta"
                placeholder="0"
                iconName="dollar"
                required
                className="font-bold text-indigo-400"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
            <Link href="/inventory" className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors">
              Cancelar
            </Link>
            <SubmitButton className="px-6 py-2.5 text-sm font-bold">
              Guardar Producto
            </SubmitButton>
          </div>

        </form>
      </Card>

    </div>
  );
}
