import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Plus, DollarSign, AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight, Package, Users, BellRing, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getActiveCashSession, getRecentTransactions } from '@/modules/transactions/services';
import { getFinancialMetrics, getInventoryMetrics, getTeamMetrics, getIncomeTrend } from '@/modules/analytics/queries';
import { generateInsights } from '@/modules/insights/rules';
import { openCashRegister } from '@/modules/transactions/actions';
import { redirect } from 'next/navigation';
import { MetricCard } from '@/components/analytics/MetricCard';
import { StatusCard } from '@/components/analytics/StatusCard';
import { ChartBar } from '@/components/analytics/ChartBar';
import { InsightCard } from '@/components/analytics/InsightCard';
import { CloseCashModal } from '@/components/analytics/CloseCashModal';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.name 
    ? profile.name.split(' ')[0] 
    : (user.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'Usuario');
  
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // Determinar el rol del usuario actual en el comercio activo
  let userRole: 'owner' | 'admin' | 'employee' = 'employee';
  if (activeStore.owner_id === user.id) {
    userRole = 'owner';
  } else {
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('store_id', activeStore.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    if (member?.role) {
      userRole = member.role as 'owner' | 'admin' | 'employee';
    }
  }

  const canCloseCash = userRole === 'owner' || userRole === 'admin';

  const activeSession = await getActiveCashSession(activeStore.id);
  const sessionId = activeSession?.id;

  const [
    recentTransactions,
    financialMetrics,
    inventoryMetrics,
    teamMetrics,
    incomeTrend,
    insights
  ] = await Promise.all([
    getRecentTransactions(activeStore.id, 5),
    getFinancialMetrics(activeStore.id, sessionId),
    getInventoryMetrics(activeStore.id),
    getTeamMetrics(activeStore.id),
    getIncomeTrend(activeStore.id),
    generateInsights(activeStore.id)
  ]);

  const initialAmount = activeSession ? Number(activeSession.amount) : 0;
  const expectedCash = initialAmount + financialMetrics.netBalance;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  };

  const chartData = incomeTrend.map(t => ({
    label: new Date(t.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    value: t.amount
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Mensajes de feedback */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.success}</p>
        </div>
      )}

      {/* Header Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
              Hola, <span className="text-indigo-500">{displayName}</span> 👋
            </h1>
            <Badge variant="neutral" className="bg-zinc-800 text-zinc-400 capitalize text-xs">
              {userRole}
            </Badge>
          </div>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Centro Analítico y Control Operativo — {activeStore.name}
          </p>
        </div>
        <Link href="/transactions/new">
          <Button className="w-full sm:w-auto shadow-sm hover:shadow">
            <Plus className="w-5 h-5 mr-1.5 -ml-1" /> Nuevo Movimiento
          </Button>
        </Link>
      </div>

      {/* Control de Caja Real */}
      {!activeSession && (
        <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex flex-col justify-center py-1.5">
            <p className="text-zinc-200 text-base font-semibold">Apertura de caja pendiente</p>
            <p className="text-zinc-500 font-normal">Abre la caja para registrar transacciones y calcular tu balance operativo.</p>
          </div>
        </div>
      )}

      {!activeSession && (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6 sm:p-8 bg-indigo-950/20 border-indigo-500/20">
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-zinc-100 mb-2">Iniciar Jornada</h2>
              <p className="text-sm text-zinc-400 mb-6">Ingresa el saldo inicial con el que inicias operaciones.</p>
              
              <form action={openCashRegister} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <CurrencyInput
                    id="amount"
                    name="amount"
                    label="Saldo Inicial"
                    placeholder="0"
                    icon={DollarSign}
                    required
                    className="text-lg font-bold"
                  />
                </div>
                <SubmitButton className="w-full sm:w-auto py-3 bg-indigo-600 hover:bg-indigo-500 text-white">
                  Abrir Caja
                </SubmitButton>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* SECCIÓN 1: Resumen Financiero */}
      <div className="space-y-4 animate-in fade-in duration-700">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-4 h-4 text-zinc-500" /> Resumen Financiero
          </h3>
          {activeSession && (
            <div className="flex items-center gap-3">
              <Badge variant="success" className="animate-pulse">
                Caja Abierta: {formatDate(activeSession.created_at)}
              </Badge>
              {canCloseCash && (
                <CloseCashModal
                  openingId={activeSession.id}
                  initialAmount={initialAmount}
                  incomeAmount={financialMetrics.totalIncome}
                  expenseAmount={financialMetrics.totalExpenses}
                  expectedAmount={expectedCash}
                />
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <MetricCard
              title="Balance Neto"
              value={formatCurrency(financialMetrics.netBalance)}
              subtitle={`Caja Operativa: ${formatCurrency(expectedCash)}`}
              icon={DollarSign}
              variant="primary"
              isMain={true}
            />
          </div>
          
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricCard
              title="Caja Inicial"
              value={formatCurrency(initialAmount)}
              icon={Wallet}
              variant="default"
            />
            <MetricCard
              title="Ingresos"
              value={`+${formatCurrency(financialMetrics.totalIncome)}`}
              subtitle={`${financialMetrics.transactionCount} transacciones`}
              icon={ArrowUpRight}
              variant="success"
            />
            <MetricCard
              title="Egresos"
              value={`-${formatCurrency(financialMetrics.totalExpenses)}`}
              icon={ArrowDownRight}
              variant="danger"
            />
          </div>
        </div>
      </div>

      {/* TEKIRA Recomienda (Insights) */}
      <div className="space-y-4 animate-in fade-in duration-700 pt-2">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-zinc-500" /> TEKIRA Recomienda
        </h3>
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <InsightCard key={insight.id} insight={insight} delayMs={idx * 150} />
            ))}
          </div>
        ) : (
          <div className="p-4 border border-zinc-800/50 bg-zinc-900/30 rounded-xl">
            <p className="text-sm text-zinc-400 font-medium">TEKIRA no encuentra riesgos importantes actualmente.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* SECCIÓN 2: Salud del Negocio */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-zinc-500" /> Salud del Negocio
          </h3>
          <div className="flex flex-col gap-4">
            <StatusCard
              title="Inventario Registrado"
              value={inventoryMetrics.totalProducts}
              subtitle="productos en el sistema"
              icon={Package}
              status="neutral"
            />
            <StatusCard
              title="Alertas de Inventario"
              value={inventoryMetrics.lowStockProducts}
              subtitle="productos requieren reposición"
              icon={BellRing}
              status={inventoryMetrics.lowStockProducts > 0 ? 'warning' : 'success'}
            />
            <StatusCard
              title="Equipo Activo"
              value={teamMetrics.activeMembers}
              subtitle={`de ${teamMetrics.totalMembers} miembros`}
              icon={Users}
              status="neutral"
            />
          </div>
        </div>

        {/* SECCIÓN 3: Tendencia de Ventas */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-zinc-500" /> Tendencia de Ingresos
          </h3>
          <div className="h-[250px]">
            <ChartBar 
              title="Últimos 7 días"
              subtitle="Evolución de ingresos diarios"
              data={chartData}
              formatValue={formatCurrency}
            />
          </div>
        </div>

      </div>

      {/* Movimientos Recientes (Mantenemos como referencia operativa) */}
      <div className="pt-4">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" /> Movimientos Recientes
        </h3>
        <Card className="p-0 sm:p-0 bg-zinc-900/40 border-zinc-800 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-800/50 text-zinc-500 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-100 mb-2">No hay movimientos</h4>
              <p className="text-sm text-zinc-400 max-w-sm">
                Registra tu primera venta o compra para empezar a ver el flujo de dinero aquí.
              </p>
              <Link href="/transactions/new" className="mt-6">
                <Button variant="secondary" className="bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700">Registrar Movimiento</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-800/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                      tx.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 group-hover:border-rose-500/40 group-hover:bg-rose-500/20'
                    } transition-all duration-300`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{tx.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-zinc-400">{formatDate(tx.created_at)}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {tx.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-base font-bold text-right ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
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
