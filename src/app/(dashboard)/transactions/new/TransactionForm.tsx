'use client';

import { useState } from 'react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { ArrowUpRight, ArrowDownRight, Tag, CreditCard, Edit3, Package, Layers, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Product } from '@/modules/inventory/types';
import { createTransaction, createMultiItemSale } from '@/modules/transactions/actions';

interface TransactionFormProps {
  products: Product[];
}

const CATEGORIES = [
  'Venta', 'Compra', 'Servicios', 'Nómina', 'Arriendo', 'Servicios Públicos',
  'Transporte', 'Mantenimiento', 'Insumos', 'Impuestos', 'Otros Ingresos', 'Otros Gastos'
];

const PAYMENT_METHODS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Tarjeta', 'Otro'];

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function TransactionForm({ products }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [useCart, setUseCart] = useState<boolean>(true);
  
  // Lista de Productos y Variantes
  const allVariants = products.flatMap(p => {
    const defaultPrice = Number((p as any).sale_price) || Number((p as any).price) || 0;
    if (p.variants && p.variants.length > 0) {
      return p.variants.map(v => ({
        id: v.id,
        productId: p.id,
        name: `${p.name} (${v.name})`,
        price: Number(v.sale_price) || defaultPrice
      }));
    }
    return [{
      id: '',
      productId: p.id,
      name: p.name,
      price: defaultPrice
    }];
  });

  // Estado del Carrito Multiproducto
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');

  // Estado para venta simple o egreso
  const [simpleAmount, setSimpleAmount] = useState<number>(0);
  const [simpleCategory, setSimpleCategory] = useState<string>('Venta');

  const addToCart = () => {
    const prod = allVariants[selectedProductIndex];
    if (!prod) return;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === prod.productId && item.variantId === (prod.id || undefined));
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + itemQty;
        copy[existingIdx].quantity = newQty;
        copy[existingIdx].subtotal = newQty * copy[existingIdx].unitPrice;
        return copy;
      }
      return [
        ...prev,
        {
          productId: prod.productId,
          variantId: prod.id || undefined,
          name: prod.name,
          quantity: itemQty,
          unitPrice: prod.price,
          subtotal: itemQty * prod.price
        }
      ];
    });
    setItemQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartQty = (index: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const copy = [...prev];
      copy[index].quantity = qty;
      copy[index].subtotal = qty * copy[index].unitPrice;
      return copy;
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const formatCOP = (val: number) => '$' + new Intl.NumberFormat('es-CO').format(val);

  return (
    <div className="space-y-6 w-full">
      {/* Selector de Tipo (Ingreso / Venta vs Egreso / Gasto) */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#0E1310] border border-[#232C26] rounded-2xl w-full">
        <button
          type="button"
          onClick={() => setType('income')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            type === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 shrink-0" /> Venta Multiproducto (Carrito)
        </button>

        <button
          type="button"
          onClick={() => setType('expense')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            type === 'expense'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 shrink-0" /> Egreso / Gasto Directo
        </button>
      </div>

      {type === 'income' ? (
        /* VENTA MULTIPRODUCTO CON CARRITO */
        <form action={createMultiItemSale} className="space-y-6 w-full">
          <input type="hidden" name="items_json" value={JSON.stringify(cart)} />
          <input type="hidden" name="payment_method" value={paymentMethod} />

          {/* Selector de Producto para agregar al Carrito */}
          <div className="p-5 bg-[#141A16] border border-[#232C26] rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F0] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#8EA653]" /> Agregar Productos al Carrito
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Seleccionar Producto
                </label>
                <select
                  value={selectedProductIndex}
                  onChange={(e) => setSelectedProductIndex(parseInt(e.target.value) || 0)}
                  className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-3.5 py-3 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none"
                >
                  {allVariants.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.name} — {formatCOP(item.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-3.5 py-3 text-sm text-center text-[#F5F5F0] font-bold focus:border-[#7C9A42] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={addToCart}
                  className="w-full py-3 px-4 bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla Resumen de Carrito */}
          <div className="p-5 bg-[#0E1310] border border-[#232C26] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F5F0]">
                Detalle de la Venta ({totalItemsCount} artículo{totalItemsCount !== 1 ? 's' : ''})
              </h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Vaciar Carrito
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#232C26] rounded-xl text-zinc-500 text-sm">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8EA653]" />
                <p>El carrito de venta está vacío.</p>
                <p className="text-xs text-zinc-600 mt-1">Selecciona productos arriba para agregarlos a la venta.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 bg-[#141A16] border border-[#232C26] rounded-xl text-sm gap-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-[#F5F5F0] truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs text-[#8EA653] font-mono mt-0.5">{formatCOP(item.unitPrice)} c/u</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 bg-[#0E1310] border border-[#232C26] rounded-lg px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateCartQty(idx, item.quantity - 1)}
                          className="w-5 h-5 text-zinc-400 hover:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-[#F5F5F0] min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(idx, item.quantity + 1)}
                          className="w-5 h-5 text-zinc-400 hover:text-white font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-[#8EA653] font-mono text-sm min-w-[80px] text-right">
                        {formatCOP(item.subtotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total General */}
            <div className="pt-4 border-t border-[#232C26] flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-400">Total de la Venta:</span>
              <span className="text-2xl font-black text-[#8EA653]">{formatCOP(cartTotal)}</span>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Método de Pago
            </label>
            <div className="relative w-full">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <CreditCard className="w-4 h-4 text-[#8EA653]" />
              </div>
            </div>
          </div>

          {/* Botón Finalizar Venta Multiproducto */}
          <div className="pt-2 border-t border-[#232C26] w-full">
            <SubmitButton
              fullWidth
              disabled={cart.length === 0}
              className="py-4 text-lg font-black bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] rounded-xl shadow-lg"
            >
              Finalizar Venta ({formatCOP(cartTotal)})
            </SubmitButton>
          </div>

        </form>
      ) : (
        /* REGISTRO DE EGRESO / GASTO DIRECTO */
        <form action={createTransaction} className="space-y-6 w-full">
          <input type="hidden" name="type" value="expense" />
          <input type="hidden" name="link_product" value="no" />

          <div className="w-full">
            <CurrencyInput
              id="amount"
              name="amount"
              label="Monto del Egreso"
              placeholder="0"
              iconName="dollar"
              value={simpleAmount || ''}
              onValueChange={(val) => setSimpleAmount(val)}
              required
              className="text-xl font-bold text-[#F5F5F0]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="category">
                Categoría del Gasto
              </label>
              <select
                id="category"
                name="category"
                defaultValue="Compra"
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none"
              >
                {CATEGORIES.filter(c => c !== 'Venta').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="payment_method">
                Método de Pago
              </label>
              <select
                id="payment_method"
                name="payment_method"
                defaultValue="Efectivo"
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            id="description"
            name="description"
            type="text"
            label="Descripción u Observaciones"
            placeholder="Ej. Pago de factura de servicios..."
            icon={Edit3}
          />

          <div className="pt-2 border-t border-[#232C26] w-full">
            <SubmitButton fullWidth className="py-3.5 text-base font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg">
              Registrar Egreso / Gasto
            </SubmitButton>
          </div>
        </form>
      )}

    </div>
  );
}
