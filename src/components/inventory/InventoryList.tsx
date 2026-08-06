'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Product } from '@/modules/inventory/types';
import { PackageSearch, ArrowRightLeft, Layers, Hash, Plus, Package } from 'lucide-react';
import { InventorySearchFilter } from './InventorySearchFilter';
import { DeleteProductModal } from './DeleteProductModal';
import { EmptyState } from '@/components/ui/EmptyState';

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
    
    if (product.name.toLowerCase().includes(term)) return true;
    if (product.sku?.toLowerCase().includes(term)) return true;
    
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
      {initialProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No tienes productos en tu catálogo"
          description={
            currentFilter === 'deleted' 
              ? 'No hay productos retirados en el historial de auditoría.' 
              : 'Comienza a registrar la memoria de productos de tu negocio asignando SKUs automáticos e inmutables.'
          }
          actionLabel={currentFilter !== 'deleted' ? 'Crear Primer Producto' : undefined}
          actionHref={currentFilter !== 'deleted' ? '/inventory/new' : undefined}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Sin resultados de búsqueda"
          description={`No se encontraron productos o SKUs coincidentes con "${searchTerm}".`}
        />
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="divide-y divide-[#232C26]">
            <div className="bg-[#0E1310] p-4 grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider hidden sm:grid">
              <div className="col-span-12 sm:col-span-5">Producto / SKU</div>
              <div className="col-span-3 sm:col-span-2 text-right">Existencia Global</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Precio Venta</div>
              <div className="col-span-3 sm:col-span-3 text-right">Acciones</div>
            </div>
            
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-[#19201C] transition-colors">
                
                <div className="col-span-12 sm:col-span-5 flex flex-col">
                  <span className="font-bold text-[#F5F5F0]">{product.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" className="px-1.5 py-0 text-[10px] bg-[#141A16]">{product.category}</Badge>
                    {product.sku && <span className="text-[11px] font-mono font-bold text-[#8EA653] flex items-center gap-1"><Hash className="w-3 h-3" /> {product.sku}</span>}
                  </div>
                  <div className="mt-2 sm:hidden">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-12 sm:col-span-2 flex flex-col sm:items-end justify-center">
                  <div className="sm:hidden text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Stock Total</div>
                  <span className="font-bold text-[#F5F5F0]">{product.quantity} <span className="text-[10px] text-zinc-500 ml-1">{product.unit}</span></span>
                </div>
                
                <div className="hidden sm:flex sm:col-span-2 flex-col items-end justify-center">
                  <span className="font-bold text-[#F5F5F0]">{formatCurrency(product.variants?.[0]?.sale_price || 0)}</span>
                  <div className="mt-1">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-12 sm:col-span-3 flex justify-start sm:justify-end items-center gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-[#232C26] sm:border-0">
                  <Link href={`/inventory/${product.id}/movement`} className="flex-1 sm:flex-none">
                    <Button variant="secondary" className="px-3 py-2 w-full sm:w-auto h-auto text-xs">
                      <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                      <span>Movimiento</span>
                    </Button>
                  </Link>

                  {currentUserRole === 'owner' && !product.deleted_at && (
                    <DeleteProductModal product={product} userRole={currentUserRole} />
                  )}
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div className="col-span-12 mt-2 pt-3 border-t border-[#232C26]">
                    <div className="flex items-center gap-1.5 mb-2 pl-1">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Variantes & SKU Obligatorio</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-[#7C9A42]/30 ml-2">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between text-xs bg-[#141A16] px-3 py-2 rounded-xl border border-[#232C26] flex-wrap gap-2">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-bold">{variant.name}</span>
                            <span className="text-[#8EA653] font-mono text-[10px] font-bold">SKU: {variant.sku || 'SKU-PENDIENTE'}</span>
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
        </Card>
      )}
    </div>
  );
}
