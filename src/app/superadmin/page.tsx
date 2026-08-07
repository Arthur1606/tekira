import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkIsSuperAdmin, getSuperAdminMetricsAction, getSuperAdminStoresAction } from '@/modules/superadmin/actions';
import { SuperAdminStoreActionsModal } from '@/components/superadmin/SuperAdminStoreActionsModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Building2, Users, Package, ShoppingCart, Power, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const isSuperAdmin = await checkIsSuperAdmin();
  if (!isSuperAdmin) {
    redirect('/dashboard');
  }

  const { error, success } = await searchParams;
  const metrics = await getSuperAdminMetricsAction();
  const stores = await getSuperAdminStoresAction();

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold text-xs">Activo</Badge>;
      case 'suspended':
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-xs">Suspendido</Badge>;
      case 'deleted':
        return <Badge variant="danger" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold text-xs">Eliminado Demo</Badge>;
      default:
        return <Badge variant="neutral" className="font-bold text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F0D] font-sans text-[#F5F5F0] p-4 sm:p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232C26] pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#141A16] rounded-2xl border border-[#232C26] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F0] tracking-tight">Super Admin TEKIRA</h1>
              <Badge variant="primary" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-mono font-bold text-[10px] uppercase">Pre-release v2.0</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Panel exclusivo de gestión global de plataforma y comercios demo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#141A16] rounded-2xl border border-[#232C26] text-xs font-mono text-[#8EA653]">
          <ShieldCheck className="w-4 h-4" /> Acceso Super Admin Concedido
        </div>
      </div>

      {/* Banner de Errores o Éxitos */}
      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Grid de Métricas Globales (Restricción de Privacidad Garantizada) */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          
          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#8EA653]" /> Total Comercios
            </span>
            <span className="text-2xl font-black text-[#F5F5F0] font-mono block">{metrics.totalStores}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Registrados en plataforma</span>
          </Card>

          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Comercios Activos
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono block">{metrics.activeStores}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Operando sin restricción</span>
          </Card>

          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5 text-amber-400" /> Suspendidos
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono block">{metrics.suspendedStores}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Acceso inhabilitado</span>
          </Card>

          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#8EA653]" /> Total Usuarios
            </span>
            <span className="text-2xl font-black text-[#F5F5F0] font-mono block">{metrics.totalUsers}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Cuentas registradas</span>
          </Card>

          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#8EA653]" /> Total Productos
            </span>
            <span className="text-2xl font-black text-[#F5F5F0] font-mono block">{metrics.totalProducts}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Agregado de catálogo</span>
          </Card>

          <Card noPadding className="p-5 space-y-2 border-[#232C26] bg-[#141A16]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-[#8EA653]" /> Total Ventas
            </span>
            <span className="text-2xl font-black text-[#F5F5F0] font-mono block">{metrics.totalSales}</span>
            <span className="text-[11px] text-zinc-500 font-medium block">Transacciones globales</span>
          </Card>

        </div>
      )}

      {/* Nota de Protección de Privacidad Operativa */}
      <div className="p-4 bg-[#141A16] rounded-2xl border border-[#232C26] flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#8EA653]" />
          <strong>Garantía de Privacidad Operativa:</strong> El módulo Super Admin únicamente visualiza métricas agregadas globales y metadata de comercios. La información privada comercial, clientes e inventarios detallados se mantienen inalcanzables.
        </span>
      </div>

      {/* Tabla de Gestión de Comercios */}
      <Card noPadding className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#232C26] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7C9A42]" /> Listado de Comercios Registrados
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Control de cuentas demo, suspensión y reactivación de accesos</p>
          </div>

          <span className="text-xs font-mono text-zinc-400 font-bold bg-[#0E1310] px-3 py-1.5 rounded-xl border border-[#232C26]">
            {stores.length} Comercio(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232C26] text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Nombre Comercio</th>
                <th className="py-3 px-3">Propietario</th>
                <th className="py-3 px-3">Fecha Creación</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Usuarios</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232C26]">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-[#19201C] transition-colors">
                  
                  <td className="py-4 px-3 font-bold text-[#F5F5F0]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#0E1310] flex items-center justify-center font-bold text-xs text-[#8EA653] border border-[#232C26]">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block">{store.name}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">{store.category} - {store.city}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3">
                    <span className="block font-bold text-zinc-200">{store.owner_name}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{store.owner_email}</span>
                  </td>

                  <td className="py-4 px-3 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDate(store.created_at)}
                  </td>

                  <td className="py-4 px-3">
                    {getStatusBadge(store.status)}
                  </td>

                  <td className="py-4 px-3 font-mono font-bold text-[#8EA653]">
                    {store.team_count} usuario(s)
                  </td>

                  <td className="py-4 px-3 text-right">
                    <SuperAdminStoreActionsModal store={store} />
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
