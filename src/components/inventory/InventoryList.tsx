'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product } from '@/modules/inventory/types';
import { PackageSearch, ArrowRightLeft, Layers, Hash, Plus } from 'lucide-react';
import { InventorySearchFilter } from './InventorySearchFilter';
import { DeleteProductModal } from './DeleteProductModal';

interface InventoryListProps {
  initialProducts: Product[];
  currentFilter: 'active' | 'out_of_stock' | 'deleted';
  currentUserRole: 'owner' | 'admin' | 'employee';
}

export function InventoryList({ initialProducts, currentFilter, currentUserRole }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Disponible</Badge>;
      case 'low_stock':
        return <Badge variant="warning">Bajo Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="danger">Agotado</Badge>;
    }
  };

  const filteredProducts = initialProducts.filter(product => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Buscar en nombre de producto
    if (product.name.toLowerCase().includes(term)) return true;
    // Buscar en SKU principal
    if (product.sku?.toLowerCase().includes(term)) return true;
    
    // Buscar en variantes
    if (product.variants) {
      return product.variants.some(v => 
        v.name.toLowerCase().includes(term) || 
        v.sku?.toLowerCase().includes(term)
      );
    }
    return false;
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      {initialProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <InventorySearchFilter searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:block">
            Mostrando {filteredProducts.length} producto(s)
          </span>
        </div>
      )}

      {/* Lista de Productos */}
      <Card noPadding className="overflow-hidden">
        {initialProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-800/50 text-zinc-500 rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">No tienes productos registrados</h4>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-6">
              {currentFilter === 'deleted' 
                ? 'No hay productos retirados en el historial de auditoría.' 
                : 'Comienza a construir la memoria física de tu negocio agregando tu primer producto al catálogo.'}
            </p>
            {currentFilter !== 'deleted' && (
              <Link href="/inventory/new">
                <Button variant="primary" className="font-bold">
                  <Plus className="w-4 h-4 mr-1.5" /> Crear primer producto
                </Button>
              </Link>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-sm font-medium">
            No se encontraron resultados para la búsqueda "{searchTerm}".
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            <div className="bg-zinc-900/50 p-4 grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden sm:grid">
              <div className="col-span-12 sm:col-span-5">Producto / SKU</div>
              <div className="col-span-3 sm:col-span-2 text-right">Existencia Global</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Precio Venta</div>
              <div className="col-span-3 sm:col-span-3 text-right">Acciones</div>
            </div>
            
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/30 transition-colors">
                
                <div className="col-span-12 sm:col-span-5 flex flex-col">
                  <span className="font-bold text-zinc-100">{product.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" className="px-1.5 py-0 text-[10px] bg-zinc-800/80">{product.category}</Badge>
                    {product.sku && <span className="text-[11px] font-mono font-bold text-indigo-400 flex items-center gap-1"><Hash className="w-3 h-3" /> {product.sku}</span>}
                  </div>
                  <div className="mt-2 sm:hidden">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-12 sm:col-span-2 flex flex-col sm:items-end justify-center">
                  <div className="sm:hidden text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Stock Total</div>
                  <span className="font-bold text-zinc-100">{product.quantity} <span className="text-[10px] text-zinc-500 ml-1">{product.unit}</span></span>
                </div>
                
                <div className="hidden sm:flex sm:col-span-2 flex-col items-end justify-center">
                  <span className="font-bold text-zinc-100">{formatCurrency(product.variants?.[0]?.sale_price || 0)}</span>
                  <div className="mt-1">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-12 sm:col-span-3 flex justify-start sm:justify-end items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-800 sm:border-0">
                  <Link href={`/inventory/${product.id}/movement`} className="flex-1 sm:flex-none">
                    <Button variant="secondary" className="px-3 py-2 w-full sm:w-auto h-auto text-xs">
                      <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                      <span>Movimiento</span>
                    </Button>
                  </Link>

                  {/* Modal de Eliminación Segura (Soft Delete) - Solo Propietario */}
                  {currentUserRole === 'owner' && !product.deleted_at && (
                    <DeleteProductModal product={product} userRole={currentUserRole} />
                  )}
                </div>

                {/* Variantes y SKU Obligatorio - Fila Secundaria */}
                {product.variants && product.variants.length > 0 && (
                  <div className="col-span-12 mt-2 pt-3 border-t border-zinc-800/30">
                    <div className="flex items-center gap-1.5 mb-2 pl-1">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Variantes & SKU Obligatorio</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-indigo-500/20 ml-2">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between text-xs bg-zinc-900/40 px-3 py-2 rounded-xl border border-zinc-800/60 flex-wrap gap-2">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-bold">{variant.name}</span>
                            <span className="text-indigo-400 font-mono text-[10px] font-bold">SKU: {variant.sku || 'SKU-PENDIENTE'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Saldo</span>
                              <span className={`font-bold font-mono text-sm ${variant.quantity > 0 ? 'text-zinc-200' : 'text-rose-400'}`}>{variant.quantity} ud</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
