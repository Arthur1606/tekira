import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateMfaSecret } from '@/modules/security/mfaActions';
import { QrCodeDisplay } from '@/components/security/QrCodeSvg';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { enableMfaMandatoryAction } from '@/modules/security/mfaActions';
import { ShieldCheck, ShieldAlert, KeyRound, QrCode, AlertCircle, Lock, CheckCircle2, Building2, UserCheck } from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090B] font-sans p-4 sm:p-6 lg:p-10 relative overflow-x-hidden">
      
      {/* Glow Decor Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* PANEL IZQUIERDO (Desktop & Mobile Main Setup Card) */}
        <div className="lg:col-span-7 bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800 p-6 sm:p-8 lg:p-10 space-y-6 animate-in zoom-in-95 duration-300">
          
          {/* Header Mobile / Desktop */}
          <div className="text-center sm:text-left space-y-3">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-black text-xl leading-none">T</span>
              </div>
              <span className="font-extrabold text-2xl text-zinc-100 tracking-tight">TEKIRA</span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">Protege tu cuenta</h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed mt-1">
                Configura la Autenticación de Dos Factores (2FA TOTP) obligatoria para tu usuario.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            
            {/* PASO 1 DE 2 */}
            <div className="bg-zinc-950/70 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" /> Paso 1 de 2
                </span>
                <span className="text-xs text-zinc-400 font-medium">Configura tu aplicación</span>
              </div>

              {/* QR Code + Copy Secret Box */}
              <QrCodeDisplay qrDataUrl={mfaRes.qrDataUrl} secret={mfaRes.secret} size={180} />
            </div>

            {/* PASO 2 DE 2 */}
            <div className="bg-zinc-950/70 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" /> Paso 2 de 2
                </span>
                <span className="text-xs text-zinc-400 font-medium">Confirma el código</span>
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
                  className="text-center font-mono text-lg sm:text-xl font-bold tracking-widest"
                />

                <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                  Confirmar y Activar Protección 2FA
                </SubmitButton>
              </form>
            </div>

          </div>

          <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5 text-zinc-600" /> TEKIRA Enterprise Security Mandatory Protection
          </div>

        </div>

        {/* PANEL DERECHO (Desktop Banner Informativo - Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 p-8 bg-zinc-950/60 backdrop-blur-md rounded-3xl border border-zinc-800/80 shadow-xl">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Seguridad Multiempresa TEKIRA</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              TEKIRA exige autenticación multifactor universal para proteger la privacidad financiera, existencias de inventario y datos operativos de cada comercio.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-200 block">Compatibilidad Estándar TOTP</span>
                <span className="text-zinc-400 text-[11px]">Funciona con Google Authenticator, Authy y Microsoft Authenticator.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-200 block">Aislamiento por Comercio</span>
                <span className="text-zinc-400 text-[11px]">Protección estricta RLS por store_id para datos organizacionales.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-xs">
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-200 block">Recuperación Controlada</span>
                <span className="text-zinc-400 text-[11px]">Restablecimiento mediante aprobación administrativa de tu empresa.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
