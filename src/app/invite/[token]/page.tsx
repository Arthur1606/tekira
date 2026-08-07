import Link from 'next/link';
import { getInvitationByToken, registerWithInvitationAction } from '@/modules/invitations/actions';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Badge } from '@/components/ui/Badge';
import { Building2, User, Mail, Lock, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const invite = await getInvitationByToken(token);

  if (!invite || !invite.is_valid) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F0D] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141A16] rounded-3xl border border-[#232C26] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#F5F5F0]">Invitación no disponible</h1>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              El enlace de invitación que intentas utilizar es inválido, ha sido cancelado o ya ha expirado. Por favor solicita una nueva invitación al administrador de tu empresa.
            </p>
          </div>
          <Link href="/login">
            <span className="inline-block w-full py-3 px-6 bg-[#1E2621] hover:bg-[#28332C] text-[#F5F5F0] text-sm font-bold rounded-xl transition-colors border border-[#232C26]">
              Ir a Iniciar Sesión
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F0D] font-sans flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      
      {/* Background glow decoration */}
      <div className="absolute top-[-25%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#556B2F]/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#556B2F]/15 blur-[160px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#141A16] backdrop-blur-2xl rounded-3xl shadow-2xl border border-[#232C26] p-6 sm:p-10 space-y-8 relative z-10 my-auto">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#556B2F]/20 rounded-2xl flex items-center justify-center mx-auto border border-[#7C9A42]/40 shadow-lg shadow-[#556B2F]/20">
            <Building2 className="w-8 h-8 text-[#8EA653]" />
          </div>

          <div>
            <span className="text-[10px] font-mono text-[#8EA653] uppercase tracking-widest block font-bold">Invitación a Equipo Empresarial</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F0] tracking-tight mt-1">{invite.store_name}</h1>
            
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-zinc-400">Rol asignado:</span>
              <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40 font-bold uppercase text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {invite.role === 'admin' ? 'Administrador' : 'Empleado'}
              </Badge>
            </div>

            <div className="mt-3 p-2.5 bg-[#0E1310] border border-[#232C26] rounded-xl flex items-center justify-between text-xs font-mono max-w-xs mx-auto">
              <span className="text-zinc-400">Código Empleado:</span>
              <span className="font-bold text-[#8EA653]">TKR-EMP-AUTO</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form action={registerWithInvitationAction} className="space-y-5">
          <input type="hidden" name="token" value={token} />

          <Input
            id="name"
            name="name"
            type="text"
            label="Tu Nombre Completo *"
            placeholder="Ej. Juan Pérez"
            icon={User}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico Verificado *"
            defaultValue={invite.email}
            icon={Mail}
            required
            readOnly
            className="bg-[#0E1310] text-zinc-400 cursor-not-allowed font-mono text-xs"
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Crea tu Contraseña *"
            placeholder="Mínimo 6 caracteres"
            icon={Lock}
            required
            minLength={6}
          />

          {/* CHECKBOX DE ACEPTACIÓN LEGAL OBLIGATORIA */}
          <div className="p-3.5 bg-[#0E1310] border border-[#232C26] rounded-2xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                name="terms_accepted"
                required
                className="mt-0.5 rounded border-[#2B372F] bg-[#0E1310] text-[#7C9A42] focus:ring-[#7C9A42] shrink-0"
              />
              <span className="leading-snug">
                Acepto los{' '}
                <Link href="/legal/terms" target="_blank" className="text-[#8EA653] underline font-bold">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-[#8EA653] underline font-bold">
                  Política de Privacidad
                </Link>{' '}
                de TEKIRA.
              </span>
            </label>
          </div>

          <div className="pt-2">
            <SubmitButton fullWidth className="py-4 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20">
              Aceptar Invitación y Configurar Seguridad 2FA
            </SubmitButton>
          </div>
        </form>

        <div className="text-center text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-1.5 pt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#7C9A42]" /> TEKIRA Employee Invitation Flow
        </div>

      </div>
    </div>
  );
}
