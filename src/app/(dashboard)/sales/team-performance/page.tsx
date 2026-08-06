import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getUserStores } from '@/modules/stores/services';
import { getTeamSalesPerformance } from '@/modules/analytics/salesPerformance';
import { TrendingUp, Users, DollarSign, ShoppingBag, Hash, Calendar, Award, ShieldAlert, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function SalesTeamPerformancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const teamPerformance = await getTeamSalesPerformance(activeStore.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
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
        return <Badge variant="primary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] font-bold">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-bold">Administrador</Badge>;
      default:
        return <Badge variant="neutral" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-bold">Empleado</Badge>;
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-500" /> Rendimiento de Ventas por Empleado
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Métricas de comercialización individual asociadas a código de empleado ({activeStore.name})
          </p>
        </div>

        <Link href="/transactions/new">
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
            <ShoppingBag className="w-4 h-4" /> Registrar Nueva Venta
          </span>
        </Link>
      </div>

      {/* Tarjetas Generales de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Ingresos por Equipo</span>
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-zinc-100">{formatCurrency(totalStoreSales)}</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Ventas acumuladas del equipo comercial</p>
        </Card>

        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Productos Vendidos</span>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-zinc-100">{totalStoreItems} unidades</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Total de mercancía colocada</p>
        </Card>

        <Card noPadding className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Vendedores Activos</span>
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-zinc-100">{teamPerformance.length} integrantes</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Vendedores registrados en el sistema</p>
        </Card>
      </div>

      {/* Tabla de Rendimiento por Empleado */}
      <Card noPadding className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" /> Escalafón Comercial por Código de Empleado
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Auto-Captura Vinculada</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
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
                <tr key={member.employeeCode + idx} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-4 px-3 font-bold text-zinc-100 flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${
                      idx === 0 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : (idx === 1 ? 'bg-zinc-700 text-zinc-200 border-zinc-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-100">{member.name}</span>
                    </div>
                  </td>

                  <td className="py-4 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
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

        {/* Adaptación Móvil */}
        <div className="md:hidden space-y-3">
          {teamPerformance.map((member, idx) => (
            <div key={member.employeeCode + idx} className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 text-indigo-400 font-bold flex items-center justify-center text-xs border border-zinc-700">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-zinc-100 block">{member.name}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{member.employeeCode}</span>
                  </div>
                </div>
                <div>
                  {getRoleBadge(member.role)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                <span className="text-zinc-400">Total Vendido:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">{formatCurrency(member.totalSalesValue)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Ventas: {member.totalTransactions}</span>
                <span>{formatDate(member.lastSaleDate)}</span>
              </div>
            </div>
          ))}
        </div>

      </Card>

    </div>
  );
}
