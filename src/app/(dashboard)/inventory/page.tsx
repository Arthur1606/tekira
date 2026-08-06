import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, PackageSearch, AlertTriangle, PackageX, Box, ArrowRightLeft, Layers } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getProducts, getInventorySummary } from '@/modules/inventory/services';
import { Product } from '@/modules/inventory/types';
import { Badge } from '@/components/ui/Badge';

export default async function InventoryPage() {
  const supabase = await createClient();
  const stores = await getUserStores();
  const activeStore = stores[0];

  const products = await getProducts(activeStore.id);
  const summary = await getInventorySummary(activeStore.id);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            Inventario
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Gestiona tus productos y existencias.
          </p>
        </div>
        <Link href="/inventory/new">
          <Button className="w-full sm:w-auto shadow-sm hover:shadow">
            <Plus className="w-5 h-5 mr-1.5 -ml-1" /> Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Grid Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
              <Box className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 mb-1">Total Productos</p>
            <h3 className="text-3xl font-black text-zinc-100">{summary.total}</h3>
          </div>
        </Card>

        <Card className="justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center border border-yellow-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 mb-1">Bajo Stock</p>
            <h3 className="text-3xl font-black text-zinc-100">{summary.lowStock}</h3>
          </div>
        </Card>

        <Card className="justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
              <PackageX className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500 mb-1">Agotados</p>
            <h3 className="text-3xl font-black text-zinc-100">{summary.outOfStock}</h3>
          </div>
        </Card>

      </div>

      {/* Lista de Productos */}
      <Card noPadding className="overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-800/50 text-zinc-500 rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">Aún no hay productos</h4>
            <p className="text-sm text-zinc-400 max-w-sm">
              Comienza a construir la memoria física de tu negocio agregando tu primer producto.
            </p>
            <Link href="/inventory/new" className="mt-6">
              <Button variant="secondary">Crear Producto</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            <div className="bg-zinc-900/50 p-4 grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Producto</div>
              <div className="col-span-3 sm:col-span-2 text-right">Cantidad</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Precio</div>
              <div className="col-span-3 sm:col-span-3 text-right">Acción</div>
            </div>
            
            {products.map((product) => (
              <div key={product.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/30 transition-colors">
                
                <div className="col-span-12 sm:col-span-5 flex flex-col">
                  <span className="font-bold text-zinc-100 truncate">{product.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" className="px-1.5 py-0 text-[10px] bg-zinc-800/80">{product.category}</Badge>
                    {product.sku && <span className="text-xs font-mono text-zinc-500">{product.sku}</span>}
                  </div>
                  <div className="mt-2 sm:hidden">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-3 sm:col-span-2 flex flex-col items-end justify-center">
                  <span className="font-bold text-zinc-100">{product.quantity}</span>
                  <span className="text-xs font-medium text-zinc-500">{product.unit}</span>
                </div>
                
                <div className="hidden sm:flex sm:col-span-2 flex-col items-end justify-center">
                  <span className="font-bold text-zinc-100">{formatCurrency(product.variants?.[0]?.sale_price || 0)}</span>
                  <div className="mt-1">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="col-span-3 sm:col-span-3 flex justify-end items-start pt-1">
                  <Link href={`/inventory/${product.id}/movement`}>
                    <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs">
                      <ArrowRightLeft className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Movimiento</span>
                    </Button>
                  </Link>
                </div>

                {/* Variantes - Fila secundaria organizada */}
                {product.variants && product.variants.length > 0 && (
                  <div className="col-span-12 mt-2 pt-3 border-t border-zinc-800/30">
                    <div className="flex items-center gap-1.5 mb-2 pl-1">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Variantes</span>
                    </div>
                    <div className="flex flex-col gap-1 pl-3 border-l-2 border-indigo-500/20 ml-2">
                      {product.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between text-xs bg-zinc-900/30 px-3 py-1.5 rounded-md">
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-bold">{variant.name}</span>
                            {variant.sku && <span className="text-zinc-600 font-mono text-[10px]">{variant.sku}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Stock</span>
                              <span className={`font-bold ${variant.quantity > 0 ? 'text-zinc-200' : 'text-rose-400'}`}>{variant.quantity}</span>
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
