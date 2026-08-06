import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateMfaSecret } from '@/modules/security/mfaActions';
import { QrCodeDisplay } from '@/components/security/QrCodeSvg';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { enableMfaMandatoryAction } from '@/modules/security/mfaActions';
import { ShieldCheck, KeyRound, QrCode, AlertCircle, Lock, Building2, UserCheck, Smartphone } from 'lucide-react';

export default async function StandaloneSetupMfaPage({
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
    <div className="min-h-screen w-full bg-[#09090B] font-sans flex items-center justify-center p-4 sm:p-6 lg:p-10 xl:p-12 relative overflow-x-hidden">
      
      {/* Background Glow Effects (Stripe / Vercel style) */}
      <div className="absolute top-[-25%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-25%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[160px] pointer-events-none"></div>

      {/* Contenedor Principal Desktop First (1400px Máximo Ancho Centrado) */}
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch relative z-10 my-auto">
        
        {/* IZQUIERDA: Card Principal de Activación 2FA (60% Ancho en Desktop, min-width 600px en escritorio) */}
        <div className="lg:col-span-7 bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-800/90 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8 min-w-0">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                <span className="text-white font-black text-2xl leading-none">T</span>
              </div>
              <div>
                <span className="font-black text-2xl text-zinc-100 tracking-tight block">TEKIRA</span>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">Enterprise Security</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-100 tracking-tight">Activación Obligatoria de 2FA</h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed mt-2">
                Vincula tu aplicación autenticadora para proteger la privacidad de inventarios y transacciones de tu comercio.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-start gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-8 w-full">
            
            {/* PASO 1 DE 2: QR & Instrucciones (Layout Interno Horizontal en Desktop) */}
            <div className="bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-800/90 space-y-6 shadow-inner w-full">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Paso 1 de 2
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-400">Configura tu aplicación</span>
              </div>

              {/* Layout Interno: QR (240px) a la izquierda, Instrucciones a la derecha en Desktop */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 w-full">
                
                {/* QR Code 240px en Desktop */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <QrCodeDisplay qrDataUrl={mfaRes.qrDataUrl} secret={mfaRes.secret} size={240} />
                </div>

                {/* Instrucciones Paso a Paso */}
                <div className="space-y-4 flex-1 min-w-0 pt-2">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" /> Instrucciones de Vinculación
                  </h3>

                  <ol className="space-y-3 text-xs sm:text-sm text-zinc-300 font-medium">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <span>Abre <strong>Google Authenticator</strong>, <strong>Authy</strong> o <strong>Microsoft Authenticator</strong> en tu teléfono.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <span>Selecciona la opción <strong>"Escanear código QR"</strong> y enfoca la pantalla.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <span>Si prefieres, copia e ingresa la clave secreta manual.</span>
                    </li>
                  </ol>
                </div>

              </div>
            </div>

            {/* PASO 2 DE 2: Código de 6 Dígitos */}
            <div className="bg-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-zinc-800/90 space-y-6 shadow-inner w-full">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Paso 2 de 2
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-400">Confirma el código</span>
              </div>

              <form action={enableMfaMandatoryAction} className="space-y-5 w-full">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  label="Ingresa el Código de 6 Dígitos de tu App *"
                  placeholder="Ej. 123456"
                  icon={KeyRound}
                  maxLength={6}
                  required
                  className="text-center font-mono text-xl sm:text-2xl font-bold tracking-widest py-3.5"
                />

                <SubmitButton fullWidth className="py-4 text-sm sm:text-base font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25">
                  Confirmar y Activar Protección 2FA
                </SubmitButton>
              </form>
            </div>

          </div>

          <div className="pt-2 text-center text-xs text-zinc-500 flex items-center justify-center gap-2 font-mono">
            <Lock className="w-4 h-4 text-zinc-600" /> TEKIRA Multi-Tenant Universal Security Enforcement
          </div>

        </div>

        {/* DERECHA: Landing Corporativa de Seguridad (40% Ancho en Desktop, Visible en lg:flex) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 sm:p-10 lg:p-12 bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/90 shadow-2xl space-y-8 min-w-0">
          
          <div className="space-y-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-1">Protección Empresarial</span>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight leading-snug">Seguridad de Nivel Enterprise</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed font-medium">
                TEKIRA protege la información financiera, existencias de inventario y transacciones de tu comercio mediante autenticación universal de dos factores y aislamiento de datos por comercio.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              
              <div className="flex items-start gap-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70 hover:border-zinc-700 transition-colors">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Compatibilidad Universal TOTP</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Integración con Google Authenticator, Authy y Microsoft Authenticator.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70 hover:border-zinc-700 transition-colors">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Aislamiento por Comercio</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Políticas RLS en Supabase que garantizan aislamiento absoluto por store_id.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800/70 hover:border-zinc-700 transition-colors">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-zinc-200 block">Recuperación Controlada</span>
                  <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                    Restablecimiento mediante previa aprobación del Propietario o Administrador.
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 text-xs sm:text-sm text-indigo-300 font-medium leading-relaxed">
            ✨ Una vez activado, tu token de seguridad quedará vinculado a tu cuenta para asegurar el ingreso en todos tus dispositivos.
          </div>

        </div>

      </div>
    </div>
  );
}
