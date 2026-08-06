'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ShoppingCart, Store, CreditCard, Plus, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createPurchase } from '@/modules/purchases/actions';
import { useRouter } from 'next/navigation';
import { getQuantityStep } from '@/modules/inventory/types';

interface PurchaseFormProps {
  suppliers: any[];
  variants: any[];
  hasActiveSession: boolean;
}

export function PurchaseForm({ suppliers, variants, hasActiveSession }: PurchaseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  
  const [items, setItems] = useState([{
    variant_id: '',
    quantity: 1,
    unit_cost: 0,
    subtotal: 0
  }]);

  const totalAmount = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleAddItem = () => {
    setItems([...items, { variant_id: '', quantity: 1, unit_cost: 0, subtotal: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto calculate subtotal
    if (field === 'quantity' || field === 'unit_cost') {
      newItems[index].subtotal = Number(newItems[index].quantity) * Number(newItems[index].unit_cost);
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveSession) {
      setError('Debes abrir la caja antes de registrar compras pagadas al instante.');
      return;
    }
    
    if (!supplierId) {
      setError('Selecciona un proveedor');
      return;
    }

    if (items.some(i => !i.variant_id || i.quantity <= 0 || i.unit_cost < 0)) {
      setError('Verifica que todos los productos tengan cantidad y costo válidos.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createPurchase(supplierId, paymentMethod, items, totalAmount);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard/purchases?success=Compra registrada con éxito');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/purchases" className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            Registrar Compra
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Abastece tu inventario y registra el gasto</p>
        </div>
      </div>

      {!hasActiveSession && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>La caja está cerrada. En esta fase (MVP), las compras descuentan dinero de caja inmediatamente. Debes <Link href="/dashboard" className="underline">abrir la caja</Link> primero.</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{error}</p>
        </div>
      )}

      {/* Datos Generales */}
      <Card>
        <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-500" /> Datos del Proveedor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Proveedor</label>
            <div className="relative">
              <Store className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl pl-12 pr-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                required
              >
                <option value="">Selecciona un proveedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {suppliers.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">No tienes proveedores. <Link href="/dashboard/suppliers/new" className="underline">Crea uno aquí</Link>.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Método de Pago</label>
            <div className="relative">
              <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl pl-12 pr-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="credito">Crédito (Próximamente)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalle de Productos */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-500" /> Productos a Abastecer
          </h3>
          <Button type="button" variant="secondary" onClick={handleAddItem} className="text-xs h-8">
            <Plus className="w-4 h-4 mr-1" /> Añadir Fila
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const selectedVar = variants.find(v => v.id === item.variant_id);
            const itemStep = getQuantityStep(selectedVar?.unit);

            return (
              <div key={index} className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 flex flex-col md:flex-row gap-4 relative">
                
                {items.length > 1 && (
                  <button type="button" onClick={() => handleRemoveItem(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">Producto / Variante</label>
                  <select
                    value={item.variant_id}
                    onChange={(e) => handleItemChange(index, 'variant_id', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.productName} {v.name !== 'Variante Principal' ? `- ${v.name}` : ''} {v.sku ? `(${v.sku})` : ''} ({v.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-28">
                  <Input
                    id={`qty-${index}`}
                    name={`qty-${index}`}
                    label={`Cant. (${selectedVar?.unit || 'un.'})`}
                    type="number"
                    min={itemStep}
                    step={itemStep}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="w-full md:w-40">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">Costo Unit.</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost === 0 ? '' : item.unit_cost}
                      onChange={(e) => handleItemChange(index, 'unit_cost', Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="w-full md:w-40">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 block">Subtotal</label>
                  <div className="bg-zinc-900 border border-zinc-800/50 rounded-lg px-3 py-2.5 text-sm text-zinc-300 font-medium text-right">
                    ${item.subtotal.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Totales y Submit */}
      <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-1">Total a Pagar</p>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
            ${totalAmount.toLocaleString('es-CO')}
          </h2>
        </div>
        
        <div className="w-full md:w-auto flex gap-3">
          <Link href="/dashboard/purchases" className="flex-1 md:flex-none">
            <span className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-zinc-900 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800">
              Cancelar
            </span>
          </Link>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1 md:flex-none text-base px-8 py-3.5 h-auto shadow-lg shadow-indigo-500/20"
            disabled={loading || !hasActiveSession}
          >
            {loading ? 'Procesando...' : 'Confirmar Compra'}
          </Button>
        </div>
      </Card>

    </form>
  );
}
