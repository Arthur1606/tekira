import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateMfaSecret } from '@/modules/security/mfaActions';
import { QrCodeDisplay } from '@/components/security/QrCodeSvg';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { enableMfaMandatoryAction } from '@/modules/security/mfaActions';
import { ShieldCheck, ShieldAlert, KeyRound, QrCode, AlertCircle, Lock, CheckCircle2, Building2, UserCheck, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default async function SetupMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const mfaRes = await generateMfaSecret();
  if ('error' in mfaRes) {
    redirect('/login?error=${encodeURIComponent("Error al inicializar 2FA.")}');
  }

  if (mfaRes.isEnabled) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090B] font-sans p-4 sm:p-6 lg:p-12 relative overflow-x-hidden">
      
      {/* Glow Decor Background Style Vercel / Linear */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch relative z-10 my-auto">
        
        {/* PANEL IZQUIERDO: Tarjeta de Activación 2FA (Ampla, Responsive y Estilo SaaS Premium) */}
        <div className="lg:col-span-7 bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/90 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8 animate-in zoom-in-95 duration-300">
          
          {/* Header del Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <span className="text-white font-black text-2xl leading-none">T</span>
              </div>
              <div>
                <span className="font-black text-xl text-zinc-100 tracking-tight block">TEKIRA</span>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Enterprise Security</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Activación Obligatoria de 2FA</h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed mt-1.5">
                Por políticas de seguridad empresarial, todas las cuentas deben vincular una aplicación autenticadora para continuar.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-start gap-3 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            
            {/* PASO 1 DE 2: Escanear QR & Clave Manual */}
            <div className="bg-zinc-950/80 p-5 sm:p-7 rounded-2xl border border-zinc-800/80 space-y-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Paso 1 de 2
                </span>
                <span className="text-xs font-semibold text-zinc-400">Configura tu aplicación</span>
              </div>

              {/* Contenedor del QR y Botón Copiar */}
              <QrCodeDisplay qrDataUrl={mfaRes.qrDataUrl} secret={mfaRes.secret} size={220} />
            </div>

            {/* PASO 2 DE 2: Código de 6 Dígitos */}
            <div className="bg-zinc-950/80 p-5 sm:p-7 rounded-2xl border border-zinc-800/80 space-y-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Paso 2 de 2
                </span>
                <span className="text-xs font-semibold text-zinc-400">Confirma el código</span>
              </div>

              <form action={enableMfaMandatoryAction} className="space-y-4">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  label="Ingresa el Código de 6 Dígitos de tu App *"
                  placeholder="Ej. 123456"
                  icon={KeyRound}
                  maxLength={6}
                  required
                  className="text-center font-mono text-xl sm:text-2xl font-bold tracking-widest"
                />

                <SubmitButton fullWidth className="py-4 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20">
                  Confirmar y Activar Protección 2FA
                </SubmitButton>
              </form>
            </div>

          </div>

          <div className="pt-2 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-zinc-600" /> TEKIRA Multi-Tenant Universal Security Enforcement
          </div>

        </div>

        {/* PANEL DERECHO: Información de Seguridad Empresarial (Visible en Desktop lg:flex, Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 lg:p-10 bg-zinc-950/70 backdrop-blur-xl rounded-3xl border border-zinc-800/90 shadow-2xl space-y-8">
          
          <div className="space-y-6">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Seguridad Reforzada TEKIRA</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-medium">
                Protegemos la información financiera, inventarios y transacciones de tu comercio mediante autenticación universal de dos factores y aislamiento multiempresa.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              
              <div className="flex items-start gap-3.5 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70">
                <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Compatibilidad Universal TOTP</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Funciona de forma nativa con Google Authenticator, Authy y Microsoft Authenticator.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70">
                <Building2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Aislamiento por Comercio</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Políticas RLS en Supabase que garantizan aislamiento absoluto por store_id.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70">
                <UserCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Recuperación Controlada</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Restablecimiento seguro mediante aprobación administrativa previa del Propietario o Admin.
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs text-indigo-300 font-medium leading-relaxed">
            💡 Una vez activado, tu token de seguridad quedará vinculado a tu cuenta en todos tus dispositivos.
          </div>

        </div>

      </div>
    </div>
  );
}
