'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { ArrowUpRight, ArrowDownRight, Tag, CreditCard, Edit3, Package, Layers } from 'lucide-react';
import { Product } from '@/modules/inventory/types';
import { createTransaction } from '@/modules/transactions/actions';

interface TransactionFormProps {
  products: Product[];
}

const CATEGORIES = [
  'Venta', 'Compra', 'Servicios', 'Nómina', 'Arriendo', 'Servicios Públicos',
  'Transporte', 'Mantenimiento', 'Insumos', 'Impuestos', 'Otros Ingresos', 'Otros Gastos'
];

const PAYMENT_METHODS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Tarjeta', 'Otro'];

export function TransactionForm({ products }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [linkProduct, setLinkProduct] = useState<boolean>(false);
  
  // Extraer todas las variantes disponibles de los productos
  const allVariants = products.flatMap(p => 
    (p.variants || []).map(v => ({
      id: v.id,
      name: v.name,
      product_name: p.name,
      sku: v.sku || null,
      sale_price: Number(v.sale_price) || 0
    }))
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string>(allVariants[0]?.id || '');
  const [amountOverride, setAmountOverride] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const selectedVariant = allVariants.find(v => v.id === selectedVariantId);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const found = allVariants.find(v => v.id === variantId);
    if (found) {
      setAmountOverride(Number(found.sale_price) * quantity);
    }
  };

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty);
    if (selectedVariant) {
      setAmountOverride(Number(selectedVariant.sale_price) * qty);
    }
  };

  return (
    <form action={createTransaction} className="space-y-6 w-full">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="link_product" value={linkProduct ? 'yes' : 'no'} />

      {/* Selector de Tipo (Ingreso / Venta vs Egreso / Gasto) */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl w-full">
        <button
          type="button"
          onClick={() => setType('income')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            type === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" /> Ingreso / Venta
        </button>

        <button
          type="button"
          onClick={() => setType('expense')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            type === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 shrink-0" /> Egreso / Gasto
        </button>
      </div>

      {/* Switch Vinculación a Producto */}
      <div className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
        <div className="space-y-0.5">
          <label className="text-sm font-bold text-zinc-200 cursor-pointer" htmlFor="linkProductSwitch">
            Vincular a Producto del Inventario
          </label>
          <p className="text-xs text-zinc-400">Actualizará el stock automáticamente al registrar el movimiento.</p>
        </div>
        <input
          id="linkProductSwitch"
          type="checkbox"
          checked={linkProduct}
          onChange={(e) => setLinkProduct(e.target.checked)}
          className="w-5 h-5 rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* Opciones de Variante y Cantidad si está vinculado */}
      {linkProduct && allVariants.length > 0 && (
        <div className="p-4 bg-zinc-950/60 border border-indigo-500/20 rounded-xl space-y-4">
          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="variant_id">
              Seleccionar Producto / Variante
            </label>
            <div className="relative w-full">
              <select
                id="variant_id"
                name="variant_id"
                value={selectedVariantId}
                onChange={(e) => handleVariantChange(e.target.value)}
                required
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
              >
                {allVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.product_name} - {v.name} (${v.sale_price.toLocaleString('es-CO')})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="w-full">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              label="Cantidad de Unidades"
              placeholder="1"
              icon={Package}
              required
            />
          </div>
        </div>
      )}

      {/* Monto de la Transacción */}
      <div className="w-full">
        <CurrencyInput
          id="amount"
          name="amount"
          label="Monto total"
          placeholder="0"
          iconName="dollar"
          defaultValue={amountOverride > 0 ? amountOverride : ''}
          onValueChange={(val) => setAmountOverride(val)}
          required
          className="text-xl font-bold text-zinc-100"
        />
      </div>

      {/* Categoría y Método de Pago */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="category">
            Categoría
          </label>
          <div className="relative w-full">
            <select
              id="category"
              name="category"
              defaultValue="Venta"
              required
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Tag className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="payment_method">
            Método de Pago
          </label>
          <div className="relative w-full">
            <select
              id="payment_method"
              name="payment_method"
              defaultValue="Efectivo"
              required
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
            >
              {PAYMENT_METHODS.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <CreditCard className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Descripción Opcional */}
      <Input
        id="description"
        name="description"
        type="text"
        label="Descripción u Observaciones (Opcional)"
        placeholder="Ej. Venta al cliente Juan..."
        icon={Edit3}
      />

      <div className="pt-2 border-t border-zinc-800/80 w-full">
        <SubmitButton fullWidth className="py-3.5 text-base font-bold shadow-lg">
          {type === 'income' ? 'Registrar Ingreso / Venta' : 'Registrar Egreso / Gasto'}
        </SubmitButton>
      </div>
    </form>
  );
}
