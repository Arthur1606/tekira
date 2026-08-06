import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Plus, DollarSign, AlertTriangle, Wallet, ArrowUpRight, ArrowDownRight, Package, Users, BellRing, Activity, TrendingUp, Lock, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getActiveCashSession, getLastClosedCashSession, getRecentTransactions } from '@/modules/transactions/services';
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
import { PilotOnboardingGuide } from '@/components/dashboard/PilotOnboardingGuide';

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

  const canManageCash = userRole === 'owner' || userRole === 'admin';

  // Obtener estado de sesión activa y último cierre de caja
  const [activeSession, lastClosedSession] = await Promise.all([
    getActiveCashSession(activeStore.id),
    getLastClosedCashSession(activeStore.id)
  ]);

  const sessionId = activeSession?.id;

  const [
    recentTransactions,
    financialMetrics,
    inventoryMetrics,
    teamMetrics,
    incomeTrend,
    insights,
    { count: locationsCount }
  ] = await Promise.all([
    getRecentTransactions(activeStore.id, 5),
    getFinancialMetrics(activeStore.id, sessionId),
    getInventoryMetrics(activeStore.id),
    getTeamMetrics(activeStore.id),
    getIncomeTrend(activeStore.id),
    generateInsights(activeStore.id),
    supabase.from('inventory_locations').select('*', { count: 'exact', head: true }).eq('store_id', activeStore.id)
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

  const hasStoreInfo = !!(activeStore.contact_phone || activeStore.contact_email);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Mensajes de feedback */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
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

      {/* Onboarding Guide Widget para Negocios Nuevos */}
      {(userRole === 'owner' || userRole === 'admin') && (
        <PilotOnboardingGuide 
          hasStoreInfo={hasStoreInfo}
          locationsCount={locationsCount || 0}
          teamCount={teamMetrics.totalMembers}
          productsCount={inventoryMetrics.totalProducts}
          isCashOpen={!!activeSession}
        />
      )}

      {/* TARJETA DINÁMICA DE ESTADO DE CAJA (OPEN / CLOSED) */}
      <div className="space-y-4 animate-in fade-in duration-700">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-800/80 pb-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-400" /> Control de Caja Operativa
          </h3>

          {/* BADGE Y BOTÓN DE ACCIÓN SEGÚN ESTADO */}
          <div className="flex items-center gap-3 flex-wrap">
            {activeSession ? (
              <>
                <Badge variant="success" className="animate-pulse bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1.5">
                  🟢 Caja Abierta ({formatDate(activeSession.created_at)})
                </Badge>
                {canManageCash && (
                  <CloseCashModal
                    openingId={activeSession.id}
                    initialAmount={initialAmount}
                    incomeAmount={financialMetrics.totalIncome}
                    expenseAmount={financialMetrics.totalExpenses}
                    expectedAmount={expectedCash}
                  />
                )}
              </>
            ) : (
              <Badge variant="neutral" className="bg-zinc-800 text-zinc-400 border-zinc-700 gap-1.5">
                ⚪ Caja Cerrada
              </Badge>
            )}
          </div>
        </div>

        {/* ESTADO 1: CAJA CERRADA -> FORMULARIO DE APERTURA */}
        {!activeSession && (
          <Card className="p-6 sm:p-8 bg-zinc-950 border-zinc-800 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 text-zinc-400">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-100">Abrir Nueva Caja</h2>
                    <p className="text-xs text-zinc-400">Inicia la jornada ingresando el saldo de apertura</p>
                  </div>
                </div>

                {lastClosedSession && (
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Último Cierre:</span>
                      <span className="font-mono text-zinc-300">{formatDate(lastClosedSession.closed_at || lastClosedSession.opening?.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold pt-1 border-t border-zinc-800/60">
                      <span className="text-zinc-400">Efectivo Contado:</span>
                      <span className="text-zinc-100 font-mono font-bold">{formatCurrency(Number(lastClosedSession.counted_amount))}</span>
                    </div>
                  </div>
                )}
              </div>

              {canManageCash ? (
                <form action={openCashRegister} className="flex flex-col sm:flex-row gap-4 items-end w-full lg:w-auto">
                  <div className="w-full sm:w-64">
                    <CurrencyInput
                      id="amount"
                      name="amount"
                      label="Monto Inicial en Caja"
                      placeholder="0"
                      iconName="dollar"
                      required
                      className="text-lg font-bold"
                    />
                  </div>
                  <SubmitButton className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg">
                    🔓 Abrir Nueva Caja
                  </SubmitButton>
                </form>
              ) : (
                <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                  La caja se encuentra cerrada. Solicita al Administrador o Propietario realizar la apertura.
                </div>
              )}

            </div>
          </Card>
        )}

        {/* METRICAS DE BALANCE DE LA JORNADA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <MetricCard
              title="Balance Neto de Jornada"
              value={formatCurrency(financialMetrics.netBalance)}
              subtitle={activeSession ? `Caja Operativa Esperada: ${formatCurrency(expectedCash)}` : 'Caja actualmente cerrada'}
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
              title="Ingresos (+)"
              value={`+${formatCurrency(financialMetrics.totalIncome)}`}
              subtitle={`${financialMetrics.transactionCount} transacciones`}
              icon={ArrowUpRight}
              variant="success"
            />
            <MetricCard
              title="Egresos (-)"
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

      {/* Movimientos Recientes */}
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
