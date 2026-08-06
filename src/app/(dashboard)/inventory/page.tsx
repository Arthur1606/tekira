import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, PackageSearch, AlertTriangle, PackageX, Box, ArrowRightLeft, Layers, Warehouse, Store, MapPin, Hash, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getProducts, getInventorySummary } from '@/modules/inventory/services';
import { getLocations } from '@/modules/inventory/locations';
import { Product } from '@/modules/inventory/types';
import { Badge } from '@/components/ui/Badge';
import { CreateLocationModal } from '@/components/inventory/CreateLocationModal';
import { TransferStockModal } from '@/components/inventory/TransferStockModal';
import { DeleteProductModal } from '@/components/inventory/DeleteProductModal';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentFilter = (resolvedSearchParams.filter || 'active') as 'active' | 'out_of_stock' | 'deleted';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const stores = await getUserStores();
  if (stores.length === 0) return null;
  const activeStore = stores[0];

  // Determinar rol del usuario actual
  let currentUserRole: 'owner' | 'admin' | 'employee' = 'employee';
  if (user && activeStore.owner_id === user.id) {
    currentUserRole = 'owner';
  } else if (user) {
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('store_id', activeStore.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (member?.role) {
      currentUserRole = member.role as 'owner' | 'admin' | 'employee';
    }
  }

  const [products, summary, locations] = await Promise.all([
    getProducts(activeStore.id, currentFilter, currentUserRole),
    getInventorySummary(activeStore.id),
    getLocations(activeStore.id)
  ]);

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

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'store':
        return <Badge variant="primary" className="bg-indigo-500/20 text-indigo-300 text-[10px]"><Store className="w-3 h-3 mr-1" /> Tienda / Punto de Venta</Badge>;
      case 'warehouse':
        return <Badge variant="neutral" className="bg-purple-500/20 text-purple-300 text-[10px]"><Warehouse className="w-3 h-3 mr-1" /> Bodega Principal</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px]"><MapPin className="w-3 h-3 mr-1" /> Depósito</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Feedback Messages */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-medium">
          <p>{resolvedSearchParams.success}</p>
        </div>
      )}

      {/* Header Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            Inventario & Bodegas
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Gestión comercial de existencias por ubicación física y SKU ({activeStore.name})
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CreateLocationModal />
          <TransferStockModal locations={locations} products={products} />
          <Link href="/inventory/new">
            <Button className="w-full sm:w-auto shadow-sm hover:shadow text-xs py-2 px-3 h-auto">
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* TARJETA DE BODEGAS Y UBICACIONES FÍSICAS */}
      <Card noPadding className="p-6 bg-zinc-950/80 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Warehouse className="w-4 h-4" /> Ubicaciones Físicas de Almacenamiento ({locations.length})
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">Control de Bodega Activo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  {loc.type === 'warehouse' ? <Warehouse className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-zinc-100 block">{loc.name}</span>
                  <div className="mt-0.5">
                    {getLocationTypeBadge(loc.type)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid Resumen y Filtros */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <Box className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400 mb-1">Total Productos</p>
              <h3 className="text-3xl font-black text-zinc-100">{summary.total}</h3>
            </div>
          </Card>

          <Card className="justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400 mb-1">Bajo Stock</p>
              <h3 className="text-3xl font-black text-zinc-100">{summary.lowStock}</h3>
            </div>
          </Card>

          <Card className="justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <PackageX className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400 mb-1">Agotados</p>
              <h3 className="text-3xl font-black text-zinc-100">{summary.outOfStock}</h3>
            </div>
          </Card>
        </div>

        {/* FILTROS DE INVENTARIO */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 pt-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>

          <Link
            href="/inventory?filter=active"
            className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
              currentFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Productos Activos
          </Link>

          <Link
            href="/inventory?filter=out_of_stock"
            className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
              currentFilter === 'out_of_stock'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Productos Sin Stock
          </Link>

          {currentUserRole === 'owner' && (
            <Link
              href="/inventory?filter=deleted"
              className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
                currentFilter === 'deleted'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-900 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              🗑️ Productos Retirados (Owner)
            </Link>
          )}
        </div>
      </div>

      {/* Lista de Productos */}
      <Card noPadding className="overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-800/50 text-zinc-500 rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">No se encontraron productos</h4>
            <p className="text-sm text-zinc-400 max-w-sm">
              {currentFilter === 'deleted' ? 'No hay productos retirados en el historial de auditoría.' : 'Comienza a construir el inventario agregando productos.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            <div className="bg-zinc-900/50 p-4 grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Producto / SKU</div>
              <div className="col-span-3 sm:col-span-2 text-right">Existencia Global</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Precio Venta</div>
              <div className="col-span-3 sm:col-span-3 text-right">Acciones</div>
            </div>
            
            {products.map((product) => (
              <div key={product.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/30 transition-colors">
                
                <div className="col-span-12 sm:col-span-5 flex flex-col">
                  <span className="font-bold text-zinc-100 truncate">{product.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="neutral" className="px-1.5 py-0 text-[10px] bg-zinc-800/80">{product.category}</Badge>
                    {product.sku && <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1"><Hash className="w-3 h-3" /> {product.sku}</span>}
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
                
                <div className="col-span-3 sm:col-span-3 flex justify-end items-center gap-2 pt-1">
                  <Link href={`/inventory/${product.id}/movement`}>
                    <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs">
                      <ArrowRightLeft className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Movimiento</span>
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
                        <div key={variant.id} className="flex items-center justify-between text-xs bg-zinc-900/40 px-3 py-2 rounded-xl border border-zinc-800/60">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-bold">{variant.name}</span>
                            <span className="text-indigo-400 font-mono text-[10px] font-bold">SKU: {variant.sku || 'SKU-PENDIENTE'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Saldo Global</span>
                              <span className={`font-bold font-mono ${variant.quantity > 0 ? 'text-zinc-200' : 'text-rose-400'}`}>{variant.quantity} unidades</span>
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
