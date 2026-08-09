import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Plus, PackageSearch, AlertTriangle, PackageX, Box, ArrowRightLeft, Layers, Warehouse, Store, MapPin, Hash, Trash2, Filter, History, RefreshCw, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getProducts, getInventorySummary } from '@/modules/inventory/services';
import { getLocations } from '@/modules/inventory/locations';
import { Product } from '@/modules/inventory/types';
import { Badge } from '@/components/ui/Badge';
import { CreateLocationModal } from '@/components/inventory/CreateLocationModal';
import { TransferStockModal } from '@/components/inventory/TransferStockModal';
import { DeleteProductModal } from '@/components/inventory/DeleteProductModal';
import { InventoryList } from '@/components/inventory/InventoryList';
import { recalculateStoreInventoryAction } from '@/modules/sales/actions';

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

  const [products, summary, locations, movementsResult] = await Promise.all([
    getProducts(activeStore.id, currentFilter, currentUserRole),
    getInventorySummary(activeStore.id),
    getLocations(activeStore.id),
    supabase
      .from('inventory_movements')
      .select('*, product:products!inner(name, store_id)')
      .eq('product.store_id', activeStore.id)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const recentMovements = movementsResult.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  };

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'store':
        return <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] text-[10px]"><Store className="w-3 h-3 mr-1" /> Tienda / Punto de Venta</Badge>;
      case 'warehouse':
        return <Badge variant="neutral" className="bg-[#556B2F]/20 text-zinc-300 text-[10px]"><Warehouse className="w-3 h-3 mr-1" /> Bodega Principal</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px]"><MapPin className="w-3 h-3 mr-1" /> Depósito</Badge>;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'SALE':
        return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-full">Venta 🛒</span>;
      case 'RETURN':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">Devolución 🔄</span>;
      case 'INBOUND':
        return <span className="px-2 py-0.5 bg-[#556B2F]/20 text-[#8EA653] border border-[#7C9A42]/30 text-[10px] font-bold rounded-full">Entrada 📦</span>;
      default:
        return <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold rounded-full">{type}</span>;
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
          <h1 className="text-3xl font-bold text-[#F5F5F0] tracking-tight">
            Inventario & Bodegas
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Gestión comercial de existencias por ubicación física y trazabilidad auditada ({activeStore.name})
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <form action={recalculateStoreInventoryAction}>
              <SubmitButton className="px-3 py-2 text-xs font-bold bg-[#141A16] hover:bg-[#19201C] text-zinc-300 border border-[#232C26]">
                <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#8EA653]" /> Recalcular Inventario
              </SubmitButton>
            </form>
          )}
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
      <Card noPadding className="p-6 bg-[#0E1310] border-[#232C26] space-y-4">
        <div className="flex items-center justify-between border-b border-[#232C26] pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8EA653] flex items-center gap-2">
            <Warehouse className="w-4 h-4" /> Ubicaciones Físicas de Almacenamiento ({locations.length})
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">Control de Bodega Activo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="p-4 bg-[#141A16] rounded-2xl border border-[#232C26] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#556B2F]/10 rounded-xl flex items-center justify-center border border-[#7C9A42]/30 text-[#8EA653]">
                  {loc.type === 'warehouse' ? <Warehouse className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-[#F5F5F0] block">{loc.name}</span>
                  <div className="mt-0.5">
                    {getLocationTypeBadge(loc.type)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* HISTORIAL DE MOVIMIENTOS DE TRAZABILIDAD COMERCIAL */}
      <Card noPadding className="p-6 bg-[#141A16] border border-[#232C26] space-y-4">
        <div className="flex items-center justify-between border-b border-[#232C26] pb-3">
          <h3 className="text-base font-bold text-[#F5F5F0] flex items-center gap-2">
            <History className="w-5 h-5 text-[#8EA653]" /> Bitácora de Movimientos y Trazabilidad Comercial
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Registro Automático de Ventas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232C26] text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3 text-center">Variación</th>
                <th className="py-3 px-3">Detalle / Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232C26]">
              {recentMovements && recentMovements.length > 0 ? (
                recentMovements.map((mov: any) => {
                  const typeUpper = (mov.type || '').toUpperCase();
                  const isExit = ['SALE', 'DAMAGE', 'LOSS', 'WASTE', 'MERMA', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'EXIT', 'OUTBOUND', 'DISCONTINUED'].includes(typeUpper);
                  const signedQuantity = isExit ? -Math.abs(Number(mov.quantity) || 0) : Math.abs(Number(mov.quantity) || 0);

                  return (
                    <tr key={mov.id} className="hover:bg-[#0E1310] transition-colors">
                      <td className="py-3 px-3 text-zinc-400">{formatDate(mov.created_at)}</td>
                      <td className="py-3 px-3">{getMovementBadge(mov.type)}</td>
                      <td className="py-3 px-3 font-bold text-[#F5F5F0]">{mov.product?.name || 'Producto del Catálogo'}</td>
                      <td className="py-3 px-3 text-center font-extrabold font-mono text-sm">
                        <span className={signedQuantity < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {signedQuantity > 0 ? `+${signedQuantity}` : signedQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">{mov.reason || 'Movimiento de inventario'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500">
                    No se han registrado movimientos de inventario aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grid Resumen y Filtros */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#556B2F]/10 text-[#8EA653] rounded-2xl flex items-center justify-center border border-[#7C9A42]/30">
                <Box className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-400 mb-1">Total Productos</p>
              <h3 className="text-3xl font-black text-[#F5F5F0]">{summary.total}</h3>
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
              <h3 className="text-3xl font-black text-[#F5F5F0]">{summary.lowStock}</h3>
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
              <h3 className="text-3xl font-black text-[#F5F5F0]">{summary.outOfStock}</h3>
            </div>
          </Card>
        </div>

        {/* FILTROS DE INVENTARIO */}
        <div className="flex items-center gap-2 border-b border-[#232C26] pb-3 pt-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>

          <Link
            href="/inventory?filter=active"
            className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
              currentFilter === 'active'
                ? 'bg-[#556B2F] text-white shadow-md'
                : 'bg-[#141A16] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Productos Activos
          </Link>

          <Link
            href="/inventory?filter=out_of_stock"
            className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
              currentFilter === 'out_of_stock'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#141A16] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
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
                  : 'bg-[#141A16] text-rose-400 hover:bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              🗑️ Productos Retirados (Owner)
            </Link>
          )}
        </div>
      </div>

      {/* Lista de Productos con Búsqueda Integrada */}
      <InventoryList 
        initialProducts={products} 
        currentFilter={currentFilter} 
        currentUserRole={currentUserRole} 
      />
      
    </div>
  );
}
