import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Mail, CheckCircle2, Clock, Settings, ShieldAlert, Shield, Hash } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getTeamMembers } from '@/modules/team/services';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const stores = await getUserStores();
  if (stores.length === 0) return null;
  const activeStore = stores[0];

  const teamMembers = await getTeamMembers(activeStore.id);

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

  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    }).format(date);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="primary" className="gap-1 bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40 font-bold"><ShieldAlert className="w-3 h-3" /> Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="gap-1 bg-[#556B2F]/20 text-zinc-300 border-[#7C9A42]/30 font-bold"><Shield className="w-3 h-3" /> Administrador</Badge>;
      case 'employee':
        return <Badge variant="neutral" className="gap-1 bg-zinc-800 text-zinc-300 border-[#2B372F] font-bold"><Users className="w-3 h-3" /> Empleado</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F5F0] tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-[#7C9A42]" /> Directorio del Equipo
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Visualización de integrantes y colaboradores de {activeStore.name}
          </p>
        </div>

        {canManageTeam && (
          <Link href="/settings?tab=team">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#141A16] hover:bg-[#19201C] text-zinc-300 text-xs font-bold rounded-xl transition-all border border-[#232C26] shadow-sm">
              <Settings className="w-4 h-4 text-[#8EA653]" /> Administración de Usuarios y Permisos
            </span>
          </Link>
        )}
      </div>

      {/* Grid de Tarjetas de Equipo (Vista Exclusivamente Informativa) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id} noPadding className="p-6 space-y-5 hover:border-zinc-700/80 transition-all duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center font-black text-lg text-[#8EA653] shadow-md">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F0]">{member.name}</h3>
                  <div className="mt-1">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
              </div>

              {member.status === 'active' ? (
                <Badge variant="success" className="text-[10px] gap-1 py-0.5 px-2">
                  <CheckCircle2 className="w-3 h-3" /> Activo
                </Badge>
              ) : (
                <Badge variant="danger" className="text-[10px] gap-1 py-0.5 px-2">
                  <Clock className="w-3 h-3" /> Inactivo
                </Badge>
              )}
            </div>

            <div className="pt-4 border-t border-[#232C26] space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-500 flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-[#8EA653]" /> Código:</span>
                <span className="font-bold text-[#8EA653]">{member.employee_code || 'TKR-EMP-000001'}</span>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 font-mono truncate">
                <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{member.email || 'Sin correo registrado'}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span>Fecha de ingreso:</span>
                <span className="font-mono text-zinc-400">{formatDate(member.created_at)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
