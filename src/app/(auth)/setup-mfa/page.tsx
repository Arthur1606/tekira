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

  // Si el usuario ya tiene 2FA activado, ir directamente a dashboard
  if (mfaRes.isEnabled) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] font-sans p-4 relative overflow-hidden">
      
      {/* Light glow decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-zinc-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800 p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header Setup */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight mb-2">Activación Obligatoria de 2FA</h1>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
            Por políticas de seguridad empresarial de TEKIRA, todas las cuentas de usuario (Propietarios, Administradores y Empleados) deben contar con Autenticación de Dos Factores (2FA) activa.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-zinc-950/70 p-6 rounded-2xl border border-zinc-800/80">
            
            {/* Código QR Visual */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <QrCodeSvg value={mfaRes.otpAuthUri} size={150} />
              <span className="text-[10px] text-zinc-500 mt-2 font-mono text-center">Escanea con tu app autenticadora</span>
            </div>

            {/* Clave Secreta e Instrucciones */}
            <div className="sm:col-span-7 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-400" /> Instrucciones
              </h3>
              <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Abre <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> o <strong>Authy</strong> en tu celular.</li>
                <li>Escanea el código QR o ingresa la clave manual.</li>
              </ol>

              <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">Clave Secreta Manual</span>
                <span className="font-mono text-xs font-bold text-indigo-300 select-all block tracking-widest">{mfaRes.secret}</span>
              </div>
            </div>

          </div>

          {/* Formulario de Confirmación */}
          <form action={enableMfaMandatoryAction} className="space-y-4 pt-2">
            <Input
              id="code"
              name="code"
              type="text"
              label="Ingresa el Código de 6 Dígitos de tu App *"
              placeholder="Ej. 123456"
              icon={KeyRound}
              maxLength={6}
              required
              className="text-center font-mono text-xl font-bold tracking-widest"
            />

            <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
              Confirmar y Activar Protección 2FA
            </SubmitButton>
          </form>

        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1">
          <Lock className="w-3.5 h-3.5" /> TEKIRA Enterprise MFA Security Enforcement
        </div>

      </div>
    </div>
  );
}
