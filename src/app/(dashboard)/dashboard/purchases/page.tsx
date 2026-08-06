import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, ShoppingCart, TrendingDown, DollarSign, Store, Clock } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getPurchases, getPurchasesMetrics, getSuppliers } from '@/modules/purchases/services';
import { redirect } from 'next/navigation';
import { MetricCard } from '@/components/analytics/MetricCard';

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const [purchases, metrics, suppliers] = await Promise.all([
    getPurchases(activeStore.id),
    getPurchasesMetrics(activeStore.id),
    getSuppliers(activeStore.id)
  ]);

  const topSupplier = suppliers.find(s => s.id === metrics.topSupplierId)?.name || 'Ninguno';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Feedback Messages */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-indigo-500" /> Compras
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Abastecimiento e historial de facturas
          </p>
        </div>
        <Link href="/dashboard/purchases/new">
          <Button className="w-full sm:w-auto shadow-sm">
            <Plus className="w-5 h-5 mr-1.5 -ml-1" /> Registrar Compra
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Comprado este mes"
          value={formatCurrency(metrics.totalMonth)}
          icon={TrendingDown}
          variant="danger"
        />
        <MetricCard
          title="Facturas / Entradas"
          value={metrics.totalPurchases.toString()}
          icon={ShoppingCart}
          variant="default"
        />
        <MetricCard
          title="Proveedor Principal"
          value={topSupplier}
          icon={Store}
          variant="primary"
        />
        <MetricCard
          title="Proveedores Activos"
          value={suppliers.length.toString()}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* List */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" /> Últimas Compras Registradas
        </h3>
        <Card className="p-0 sm:p-0 bg-zinc-900/40 border-zinc-800 overflow-hidden">
          {purchases.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-800/50 text-zinc-500 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-100 mb-2">No hay compras registradas</h4>
              <p className="text-sm text-zinc-400 max-w-sm">
                Registra tu primera compra para abastecer el inventario y mantener tus costos actualizados.
              </p>
              <Link href="/dashboard/purchases/new" className="mt-6">
                <Button variant="primary">Registrar Compra</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{purchase.supplier?.name || 'Proveedor Desconocido'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-zinc-400">{formatDate(purchase.created_at)}</span>
                        <Badge variant={purchase.status === 'completed' ? 'success' : 'neutral'} className="text-[10px]">
                          {purchase.status}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {purchase.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-black text-zinc-100">
                    {formatCurrency(Number(purchase.total_amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
