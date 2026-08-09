import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getUserStores } from '@/modules/stores/services';
import { getTeamSalesPerformance } from '@/modules/analytics/salesPerformance';
import { TrendingUp, Users, DollarSign, ShoppingBag, Hash, Calendar, Award, ShieldAlert, Shield, Eye, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function SalesTeamPerformancePage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const statusFilter = resolvedSearchParams.status || 'todas';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const teamPerformance = await getTeamSalesPerformance(activeStore.id);

  // Cargar las últimas ventas con metadatos completos y filtro de estado
  let salesQuery = supabase
    .from('sales')
    .select('*')
    .eq('store_id', activeStore.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (statusFilter === 'pendiente') {
    salesQuery = salesQuery.eq('status', 'pendiente');
  } else if (statusFilter === 'entregado') {
    salesQuery = salesQuery.eq('status', 'entregado');
  }

  const { data: recentSales } = await salesQuery;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin ventas registradas';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  };

  const totalStoreSales = teamPerformance.reduce((acc, curr) => acc + curr.totalSalesValue, 0);
  const totalStoreItems = teamPerformance.reduce((acc, curr) => acc + curr.totalItemsCount, 0);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40 text-[10px] font-bold">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="bg-[#556B2F]/20 text-zinc-300 border-[#7C9A42]/30 text-[10px] font-bold">Administrador</Badge>;
      default:
        return <Badge variant="neutral" className="bg-zinc-800 text-zinc-300 border-[#2B372F] text-[10px] font-bold">Empleado</Badge>;
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F5F0] tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#7C9A42]" /> Rendimiento de Ventas y Control Comercial
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Métricas de comercialización individual asociadas a código de empleado ({activeStore.name})
          </p>
        </div>

        <Link href="/transactions/new">
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#556B2F]/20">
            <ShoppingBag className="w-4 h-4" /> Registrar Nueva Venta
          </span>
        </Link>
      </div>

      {/* Tarjetas Generales de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Ingresos por Equipo</span>
            <div className="w-10 h-10 bg-[#556B2F]/10 rounded-xl flex items-center justify-center text-[#8EA653] border border-[#7C9A42]/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#F5F5F0]">{formatCurrency(totalStoreSales)}</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Ventas acumuladas del equipo comercial</p>
        </Card>

        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Productos Vendidos</span>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#F5F5F0]">{totalStoreItems} unidades</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Total de mercancía colocada</p>
        </Card>

        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Vendedores Activos</span>
            <div className="w-10 h-10 bg-[#556B2F]/15 rounded-xl flex items-center justify-center text-[#8EA653] border border-[#7C9A42]/30">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#F5F5F0]">{teamPerformance.length} integrantes</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Vendedores registrados en el sistema</p>
        </Card>
      </div>

      {/* Listado de Últimas Ventas con Filtros de Estado */}
      <Card noPadding className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#232C26] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8EA653]" /> Historial de Ventas y Estado de Entregas
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Control de despacho y seguimiento comercial</p>
          </div>

          {/* Filtros por Estado */}
          <div className="flex items-center gap-1.5 bg-[#0E1310] border border-[#232C26] p-1 rounded-xl">
            <Link
              href="/sales/team-performance?status=todas"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'todas'
                  ? 'bg-[#556B2F] text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas
            </Link>
            <Link
              href="/sales/team-performance?status=pendiente"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'pendiente'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🟡 Pendientes
            </Link>
            <Link
              href="/sales/team-performance?status=entregado"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'entregado'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🟢 Entregadas
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232C26] text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Venta #</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-3">Empleado</th>
                <th className="py-3 px-3">Cliente / Tipo</th>
                <th className="py-3 px-3">Pago</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232C26]">
              {recentSales && recentSales.length > 0 ? (
                recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-[#141A16] transition-colors">
                    <td className="py-3.5 px-3 font-bold font-mono text-[#8EA653]">
                      {sale.sale_number || `#${sale.id.slice(0, 8)}`}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${
                        (sale.status || 'pendiente') === 'entregado'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {(sale.status || 'pendiente') === 'entregado' ? '🟢 Entregado' : '🟡 Pendiente'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-zinc-400">
                      {formatDate(sale.created_at)}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold text-zinc-300">
                      {sale.employee_code || 'TKR-EMP-000001'}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="block font-bold text-[#F5F5F0]">{sale.customer_name || 'Mostrador'}</span>
                      <span className="text-[10px] text-zinc-400 capitalize">{sale.sale_type || 'mostrador'}</span>
                    </td>

                    <td className="py-3.5 px-3 capitalize text-zinc-300">
                      {sale.payment_method}
                    </td>

                    <td className="py-3.5 px-3 text-right font-extrabold text-[#8EA653] text-sm">
                      {formatCurrency(sale.total_amount)}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <Link href={`/sales/${sale.id}`}>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#556B2F]/30 hover:bg-[#556B2F] text-[#8EA653] hover:text-white border border-[#7C9A42]/40 rounded-lg text-xs font-bold transition-all">
                          <Eye className="w-3.5 h-3.5" /> Ver detalle
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No se han registrado ventas recientemente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Escalafón Comercial */}
      <Card noPadding className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#232C26] pb-4">
          <h3 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8EA653]" /> Escalafón Comercial por Código de Empleado
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Auto-Captura Vinculada</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232C26] text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Vendedor</th>
                <th className="py-3 px-3">Código Empleado</th>
                <th className="py-3 px-3">Rol</th>
                <th className="py-3 px-3 text-right">Transacciones</th>
                <th className="py-3 px-3 text-right">Monto Vendido</th>
                <th className="py-3 px-3 text-right">Última Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {teamPerformance.map((member, idx) => (
                <tr key={member.employeeCode + idx} className="hover:bg-[#141A16] transition-colors">
                  <td className="py-4 px-3 font-bold text-[#F5F5F0] flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${
                      idx === 0 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : (idx === 1 ? 'bg-zinc-700 text-zinc-200 border-zinc-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <span className="block font-bold text-[#F5F5F0]">{member.name}</span>
                    </div>
                  </td>

                  <td className="py-4 px-3 font-mono font-bold text-[#8EA653] whitespace-nowrap">
                    {member.employeeCode}
                  </td>

                  <td className="py-4 px-3">
                    {getRoleBadge(member.role)}
                  </td>

                  <td className="py-4 px-3 text-right font-mono text-zinc-300 font-bold">
                    {member.totalTransactions} ventas
                  </td>

                  <td className="py-4 px-3 text-right font-mono font-black text-emerald-400 text-sm">
                    {formatCurrency(member.totalSalesValue)}
                  </td>

                  <td className="py-4 px-3 text-right font-mono text-zinc-400 text-[11px]">
                    {formatDate(member.lastSaleDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
