import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { getUserStores } from '@/modules/stores/services';
import { getTeamMembers } from '@/modules/team/services';
import { updateProfile } from '@/modules/team/actions';
import { updateStoreSettings } from '@/modules/stores/actions';
import { generateMfaSecret, enableMfa, disableMfa, approveMfaReset, rejectMfaReset } from '@/modules/security/mfaActions';
import { EditMemberModal } from '@/components/team/EditMemberModal';
import { DeleteMemberModal } from '@/components/team/DeleteMemberModal';
import { User, Users, Lock, Plus, Building, CheckCircle2, Clock, Info, Globe, Phone, Mail, DollarSign, ShieldAlert, ShieldCheck, KeyRound, QrCode, Check, X, Hash } from 'lucide-react';
import Link from 'next/link';

const CURRENCIES = [
  { code: 'COP', name: 'Peso Colombiano ($ COP)' },
  { code: 'USD', name: 'Dólar Estadounidense ($ USD)' },
  { code: 'EUR', name: 'Euro (€ EUR)' },
  { code: 'MXN', name: 'Peso Mexicano ($ MXN)' },
  { code: 'PEN', name: 'Sol Peruano (S/ PEN)' },
  { code: 'CLP', name: 'Peso Chileno ($ CLP)' },
];

const TIMEZONES = [
  { code: 'America/Bogota', name: 'América / Bogotá (GMT-5)' },
  { code: 'America/Mexico_City', name: 'América / Ciudad de México (GMT-6)' },
  { code: 'America/Lima', name: 'América / Lima (GMT-5)' },
  { code: 'America/Santiago', name: 'América / Santiago (GMT-3)' },
  { code: 'UTC', name: 'Tiempo Universal Coordinado (UTC)' },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab === 'company' 
    ? 'company' 
    : (resolvedSearchParams.tab === 'security' 
      ? 'security' 
      : (resolvedSearchParams.tab === 'team' ? 'team' : 'profile'));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // Determinar rol del usuario actual en el comercio activo
  let currentUserRole: 'owner' | 'admin' | 'employee' = 'employee';
  let currentEmployeeCode: string = 'TKR-EMP-000001';

  const { data: member } = await supabase
    .from('team_members')
    .select('role, employee_code')
    .eq('store_id', activeStore.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeStore.owner_id === user.id) {
    currentUserRole = 'owner';
  } else if (member?.role) {
    currentUserRole = member.role as 'owner' | 'admin' | 'employee';
  }

  if (member?.employee_code) {
    currentEmployeeCode = member.employee_code;
  }

  const canManageStore = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';
  const teamMembers = canManageTeam ? await getTeamMembers(activeStore.id) : [];

  // Datos de 2FA TOTP si la pestaña activa es security
  let mfaData = { secret: '', otpAuthUri: '', isEnabled: false };
  let pendingResetRequests: any[] = [];

  if (activeTab === 'security') {
    const mfaRes = await generateMfaSecret();
    if (!('error' in mfaRes)) {
      mfaData = mfaRes as any;
    }

    if (canManageTeam) {
      const { data: resetReqs } = await supabase
        .from('mfa_reset_requests')
        .select('*')
        .eq('store_id', activeStore.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      pendingResetRequests = resetReqs || [];
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="primary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold">Administrador</Badge>;
      case 'employee':
        return <Badge variant="neutral" className="bg-zinc-800 text-zinc-300 border-zinc-700">Empleado</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="gap-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> Comercio Activo</Badge>;
      case 'suspended':
        return <Badge variant="warning" className="gap-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3.5 h-3.5" /> Suspendido</Badge>;
      case 'blocked':
        return <Badge variant="danger" className="gap-1.5 bg-rose-500/20 text-rose-400 border-rose-500/30"><ShieldAlert className="w-3.5 h-3.5" /> Bloqueado</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Configuraciones</h1>
        <p className="text-sm text-zinc-400 mt-1">Gestiona tu perfil, datos empresariales, seguridad 2FA obligatoria y equipo</p>
      </div>

      {/* Retroalimentación */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium">
          <p>{resolvedSearchParams.success}</p>
        </div>
      )}

      {/* Tabs Naves */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 flex-wrap">
        <Link
          href="/settings?tab=profile"
          className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="w-4 h-4" /> Mi Perfil
        </Link>

        <Link
          href="/settings?tab=company"
          className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'company'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building className="w-4 h-4" /> Empresa / Comercio
        </Link>

        <Link
          href="/settings?tab=security"
          className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'security'
              ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Seguridad (2FA)
        </Link>

        {canManageTeam && (
          <Link
            href="/settings?tab=team"
            className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'team'
                ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" /> Gestión de Equipo
          </Link>
        )}
      </div>

      {/* TAB 1: MI PERFIL */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <Card noPadding className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/10 border border-indigo-400/20">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">{profile?.name || user.email}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(currentUserRole)}
                    <span className="text-xs font-mono text-zinc-500">{user.email}</span>
                  </div>
                </div>
              </div>

              <form action={updateProfile} className="space-y-6">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Nombre Completo"
                  defaultValue={profile?.name || ''}
                  icon={User}
                  required
                />

                <div className="w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Código Único de Empleado (Inmutable)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentEmployeeCode}
                      disabled
                      className="block w-full rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-4 py-3 pl-10 text-sm font-mono font-bold text-indigo-300 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                      <Hash className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Tu código de identificación interna en {activeStore.name}.
                  </p>
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Correo Electrónico Principal (Autenticación)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="block w-full rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3 pl-10 text-sm text-zinc-400 cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <SubmitButton fullWidth className="py-3 text-sm font-bold shadow-lg">
                    Guardar Cambios de Perfil
                  </SubmitButton>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card noPadding className="p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-4">
                <Building className="w-5 h-5 text-indigo-500" /> Resumen de Empresa
              </h3>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-400">Nombre Comercial</span>
                  <span className="font-bold text-zinc-100">{activeStore.name}</span>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-400">Código de Empresa</span>
                  <span className="font-mono font-bold text-indigo-400">{activeStore.company_code}</span>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between">
                  <span className="text-zinc-400">Estado</span>
                  {getStatusBadge(activeStore.status || 'active')}
                </div>

                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-300">
                  <p className="text-[11px] leading-relaxed">
                    Tu usuario cuenta con permisos de <strong>{currentUserRole}</strong> para operar la plataforma de {activeStore.name}.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EMPRESA / COMERCIO */}
      {activeTab === 'company' && (
        <Card noPadding className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" /> Perfil Empresarial del Comercio
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Configuración general y datos organizacionales de la empresa</p>
            </div>
            <div>
              {getStatusBadge(activeStore.status || 'active')}
            </div>
          </div>

          <form action={updateStoreSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                id="name"
                name="name"
                type="text"
                label="Nombre Comercial *"
                defaultValue={activeStore.name}
                icon={Building}
                disabled={!canManageStore}
                required
              />

              <Input
                id="city"
                name="city"
                type="text"
                label="Ciudad de Operación"
                defaultValue={activeStore.city}
                icon={Globe}
                disabled={!canManageStore}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                id="contact_phone"
                name="contact_phone"
                type="text"
                label="Teléfono de Contacto"
                placeholder="Ej. +57 300 123 4567"
                defaultValue={activeStore.contact_phone || ''}
                icon={Phone}
                disabled={!canManageStore}
              />

              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                label="Correo Institucional"
                placeholder="ejemplo@empresa.com"
                defaultValue={activeStore.contact_email || ''}
                icon={Mail}
                disabled={!canManageStore}
              />
            </div>

            <Input
              id="logo_url"
              name="logo_url"
              type="text"
              label="URL del Logo (Opcional)"
              placeholder="https://misitio.com/logo.png"
              defaultValue={activeStore.logo_url || ''}
              disabled={!canManageStore}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="currency">
                  Moneda de Operación
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={activeStore.currency || 'COP'}
                    disabled={!canManageStore}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none disabled:cursor-not-allowed disabled:text-zinc-500"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <DollarSign className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="timezone">
                  Zona Horaria
                </label>
                <div className="relative">
                  <select
                    id="timezone"
                    name="timezone"
                    defaultValue={activeStore.timezone || 'America/Bogota'}
                    disabled={!canManageStore}
                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none disabled:cursor-not-allowed disabled:text-zinc-500"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.code} value={tz.code}>{tz.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Globe className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {canManageStore ? (
              <div className="pt-4 border-t border-zinc-800">
                <SubmitButton fullWidth className="py-3 text-sm font-bold shadow-lg">
                  Guardar Configuración de Comercio
                </SubmitButton>
              </div>
            ) : (
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                Únicamente Propietarios y Administradores poseen permisos para editar la configuración de la empresa.
              </div>
            )}
          </form>
        </Card>
      )}

      {/* TAB 3: SEGURIDAD (2FA TOTP OBLIGATORIO) */}
      {activeTab === 'security' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          <Card noPadding className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" /> Autenticación de Dos Factores (2FA Obligatorio)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Protección TOTP requerida para todos los integrantes del comercio.
                </p>
              </div>

              <div>
                {mfaData.isEnabled ? (
                  <Badge variant="success" className="gap-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 2FA Activado
                  </Badge>
                ) : (
                  <Badge variant="danger" className="gap-1.5 bg-rose-500/20 text-rose-400 border-rose-500/30">
                    🔴 2FA Pendiente (Requerido)
                  </Badge>
                )}
              </div>
            </div>

            {mfaData.isEnabled ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <p className="font-bold">Tu cuenta cumple con la política de 2FA Obligatorio</p>
                    <p className="text-xs text-emerald-400/80 mt-0.5 leading-relaxed">
                      Tu dispositivo autenticador está vinculado. Se solicitará el código de 6 dígitos en cada inicio de sesión.
                    </p>
                  </div>
                </div>

                <form action={disableMfa} className="pt-2">
                  <SubmitButton variant="ghost" className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs py-2.5 px-5">
                    Reconfigurar Dispositivo 2FA
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  <div className="md:col-span-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-indigo-400" /> Paso 1: Escanea con tu App
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Usa Google Authenticator, Microsoft Authenticator o Authy para escanear la clave secreta:
                    </p>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Clave Secreta TOTP</span>
                      <span className="font-mono text-sm font-bold text-indigo-300 select-all block tracking-widest">{mfaData.secret}</span>
                    </div>

                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                      <span className="font-bold text-zinc-300 block">URI de Vinculación OtpAuth:</span>
                      <p className="font-mono text-[10px] text-zinc-500 truncate">{mfaData.otpAuthUri}</p>
                    </div>
                  </div>

                  <div className="md:col-span-6 bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-400" /> Paso 2: Confirma el Código
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ingresa el código de 6 dígitos para completar el registro de seguridad:
                    </p>

                    <form action={enableMfa} className="space-y-4">
                      <Input
                        id="code"
                        name="code"
                        type="text"
                        placeholder="Ej. 123456"
                        maxLength={6}
                        required
                        className="font-mono text-lg font-bold text-center tracking-widest"
                      />

                      <SubmitButton fullWidth className="py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                        Activar Protección 2FA Obligatoria
                      </SubmitButton>
                    </form>
                  </div>

                </div>
              </div>
            )}
          </Card>

          {canManageTeam && (
            <Card noPadding className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-400" /> Solicitudes Pendientes de Recuperación 2FA
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Colaboradores de tu empresa que solicitaron restablecimiento por pérdida de dispositivo
                  </p>
                </div>

                {pendingResetRequests.length > 0 && (
                  <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {pendingResetRequests.length} Solicitud(es)
                  </Badge>
                )}
              </div>

              {pendingResetRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-medium">
                  No hay solicitudes pendientes de recuperación de 2FA para tu empresa.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingResetRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-200">ID Usuario: {req.user_id.substring(0, 8)}...</span>
                          <span className="text-[10px] font-mono text-zinc-500">({formatDate(req.requested_at)})</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium">
                          <strong>Motivo:</strong> {req.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <form action={approveMfaReset}>
                          <input type="hidden" name="request_id" value={req.id} />
                          <SubmitButton variant="ghost" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-2 px-3">
                            <Check className="w-3.5 h-3.5 mr-1" /> Aprobar Restablecimiento
                          </SubmitButton>
                        </form>

                        <form action={rejectMfaReset}>
                          <input type="hidden" name="request_id" value={req.id} />
                          <SubmitButton variant="ghost" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 text-xs font-bold py-2 px-3">
                            <X className="w-3.5 h-3.5 mr-1" /> Rechazar
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>
      )}

      {/* TAB 4: GESTIÓN DE EQUIPO (Solo Owner y Admin) */}
      {activeTab === 'team' && canManageTeam && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Integrantes del Equipo</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Administra los accesos, códigos de empleado y estado de 2FA de tus colaboradores</p>
            </div>

            <Link href="/team/new">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" /> Agregar Integrante
              </span>
            </Link>
          </div>

          <Card noPadding className="p-6">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Nombre</th>
                    <th className="py-3 px-3">Código Empleado</th>
                    <th className="py-3 px-3">Correo</th>
                    <th className="py-3 px-3">Rol</th>
                    <th className="py-3 px-3">Estado 2FA</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-4 px-3 font-bold text-zinc-100 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 border border-zinc-700">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </td>

                      <td className="py-4 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {member.employee_code || 'TKR-EMP-000001'}
                      </td>

                      <td className="py-4 px-3 text-zinc-400 font-mono">
                        {member.email || <span className="text-zinc-600 italic">Sin correo</span>}
                      </td>

                      <td className="py-4 px-3">
                        {getRoleBadge(member.role)}
                      </td>

                      <td className="py-4 px-3">
                        {member.mfa_enabled ? (
                          <Badge variant="success" className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> 2FA Activo
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 bg-rose-500/20 text-rose-400 border-rose-500/30">
                            <Clock className="w-3 h-3" /> 2FA Pendiente
                          </Badge>
                        )}
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditMemberModal member={member} currentUserRole={currentUserRole} />
                          <DeleteMemberModal member={member} currentUserRole={currentUserRole} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 border border-zinc-700">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-100 block">{member.name}</span>
                        <span className="text-xs font-mono font-bold text-indigo-400">{member.employee_code || 'TKR-EMP-000001'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <EditMemberModal member={member} currentUserRole={currentUserRole} />
                      <DeleteMemberModal member={member} currentUserRole={currentUserRole} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      {member.mfa_enabled ? (
                        <Badge variant="success" className="text-[10px] py-0.5">2FA Activo</Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px] py-0.5">2FA Pendiente</Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{member.email || 'Sin correo'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Footer de Versión del Sistema */}
      <div className="pt-6 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-zinc-600" /> TEKIRA Enterprise Universal 2FA System</span>
        <span className="bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 text-zinc-400">
          TEKIRA Versión 0.11.3
        </span>
      </div>

    </div>
  );
}
