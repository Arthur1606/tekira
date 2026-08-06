'use client';

import { useState, useEffect } from 'react';
import { createTransaction } from '@/modules/transactions/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/modules/transactions/types';
import { DollarSign, Tag, FileText, Wallet, Package, Box } from 'lucide-react';
import { Product, getQuantityStep } from '@/modules/inventory/types';

interface TransactionFormProps {
  products: Product[];
}

export function TransactionForm({ products }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [linkProduct, setLinkProduct] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('');

  const allVariants = products.flatMap(p => 
    (p.variants || []).map(v => ({
      ...v,
      productName: p.name,
      unit: p.unit
    }))
  );

  const selectedVariant = allVariants.find(v => v.id === selectedVariantId);
  const quantityStep = getQuantityStep(selectedVariant?.unit);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Auto-calcular sugerencia de precio basado en la variante seleccionada y tipo
  useEffect(() => {
    if (linkProduct && selectedVariantId && quantity) {
      const variant = allVariants.find(v => v.id === selectedVariantId);
      if (variant) {
        const qty = parseFloat(quantity) || 0;
        const unitPrice = type === 'income' ? variant.sale_price : variant.cost;
        const total = qty * unitPrice;
        
        if (total > 0) {
          setAmount(total.toString());
        }
      }
    }
  }, [linkProduct, selectedVariantId, quantity, type, products]);

  return (
    <form action={createTransaction} className="space-y-6">
      
      {/* Selector de Tipo (Ingreso/Egreso) */}
      <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
        <button
          type="button"
          onClick={() => { setType('income'); setAmount(''); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            type === 'income' 
              ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Ingreso (Entrada)
        </button>
        <button
          type="button"
          onClick={() => { setType('expense'); setAmount(''); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            type === 'expense' 
              ? 'bg-zinc-800 text-rose-400 shadow-sm border border-zinc-700' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Egreso (Salida)
        </button>
      </div>
      
      <input type="hidden" name="type" value={type} />

      {/* Relación con Inventario */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            name="link_product"
            value="yes"
            checked={linkProduct}
            onChange={(e) => {
              setLinkProduct(e.target.checked);
              if (!e.target.checked) {
                setSelectedVariantId('');
                setQuantity('1');
              }
            }}
            className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-zinc-900"
          />
          <div>
            <span className="block text-sm font-bold text-indigo-300">¿Relacionar con un producto?</span>
            <span className="block text-xs font-medium text-indigo-400 mt-0.5">
              {type === 'income' 
                ? 'Descontará automáticamente del inventario (Ej. Venta).' 
                : 'Sumará automáticamente al inventario (Ej. Compra).'}
            </span>
          </div>
        </label>

        {linkProduct && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-indigo-500/20">
            <div className="w-full">
              <label className="block text-xs font-bold text-indigo-300 mb-1.5" htmlFor="variant_id">
                Selecciona el producto
              </label>
              <div className="relative">
                <select
                  id="variant_id"
                  name="variant_id"
                  required={linkProduct}
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="block w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 px-3 py-2 pl-9 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm appearance-none"
                >
                  <option value="" disabled>Elegir variante...</option>
                  {allVariants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.productName} - {v.name} ({v.quantity} {v.unit} disponibles)
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-indigo-400">
                  <Box className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="w-full">
              <label className="block text-xs font-bold text-indigo-300 mb-1.5" htmlFor="quantity">
                Cantidad ({selectedVariant?.unit || 'un.'})
              </label>
              <div className="relative">
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step={quantityStep}
                  min={quantityStep}
                  required={linkProduct}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={quantityStep === '1' ? '1' : '0.00'}
                  className="block w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 px-3 py-2 pl-9 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-indigo-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CurrencyInput
        id="amount"
        name="amount"
        label="Valor Final del Movimiento"
        placeholder="0"
        icon={DollarSign}
        defaultValue={amount}
        onValueChange={(val) => setAmount(val.toString())}
        required
        className="text-lg font-black text-zinc-100"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="w-full">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="category">
            Categoría Financiera
          </label>
          <div className="relative">
            <select
              id="category"
              name="category"
              required
              defaultValue=""
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 pl-10 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none"
            >
              <option value="" disabled>Selecciona...</option>
              {categories.map(cat => (
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

        <div className="w-full">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="payment_method">
            Método de Pago
          </label>
          <div className="relative">
            <select
              id="payment_method"
              name="payment_method"
              required
              defaultValue=""
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 pl-10 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none capitalize"
            >
              <option value="" disabled>Selecciona...</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method} className="capitalize">{method}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <Input
        id="description"
        name="description"
        type="text"
        label="Descripción (Opcional)"
        placeholder="Ej. Pago de factura #1234"
        icon={FileText}
      />

      <div className="pt-4 border-t border-zinc-800">
        <SubmitButton fullWidth className="py-3 text-base">
          Guardar Movimiento
        </SubmitButton>
      </div>
    </form>
  );
}
