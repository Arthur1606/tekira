import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateMfaSecret } from '@/modules/security/mfaActions';
import { QrCodeSvg } from '@/components/security/QrCodeSvg';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { enableMfaMandatoryAction } from '@/modules/security/mfaActions';
import { ShieldAlert, KeyRound, QrCode, AlertCircle, Lock } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090B] font-sans p-4 sm:p-6 lg:p-8 relative overflow-x-hidden">
      
      {/* Glow Decor Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg lg:max-w-2xl bg-zinc-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-800 p-5 sm:p-8 lg:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header Setup */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl leading-none">T</span>
            </div>
            <span className="font-extrabold text-2xl text-zinc-100 tracking-tight">TEKIRA</span>
          </div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20 shadow-inner">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight mb-2">Activación Obligatoria de 2FA</h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
            Por políticas de seguridad empresarial, todas las cuentas deben contar con Autenticación de Dos Factores (2FA) activa.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          
          {/* Bloque Informativo Adapte: 1 Columna en Mobile (< sm), 2 Columnas en Desktop (>= lg) */}
          <div className="flex flex-col lg:flex-row items-center gap-6 bg-zinc-950/70 p-4 sm:p-6 rounded-2xl border border-zinc-800/80">
            
            {/* Código QR Centrado */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center shrink-0">
              <QrCodeSvg value={mfaRes.otpAuthUri} size={160} />
              <span className="text-[11px] text-zinc-500 mt-2 font-mono text-center">Escanea con tu app autenticadora</span>
            </div>

            {/* Clave Secreta e Instrucciones */}
            <div className="w-full lg:w-1/2 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-400" /> Instrucciones
              </h3>
              <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Abre <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> o <strong>Authy</strong>.</li>
                <li>Escanea el código QR o ingresa la clave manual.</li>
              </ol>

              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Clave Secreta Manual</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-indigo-300 select-all block tracking-widest break-all">{mfaRes.secret}</span>
              </div>
            </div>

          </div>

          {/* Formulario de Confirmación */}
          <form action={enableMfaMandatoryAction} className="space-y-4 pt-2 w-full">
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

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5 text-zinc-600" /> TEKIRA Enterprise MFA Security Enforcement
        </div>

      </div>
    </div>
  );
}
