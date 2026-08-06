import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { verifyMfaLoginAction } from '@/modules/security/mfaActions';
import { ShieldCheck, Lock, AlertCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default async function MfaVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F0D] font-sans p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#556B2F]/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#556B2F]/15 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#141A16] backdrop-blur-md rounded-3xl shadow-2xl border border-[#232C26] p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header Setup */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#556B2F]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#7C9A42]/30 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#8EA653]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F5F0] tracking-tight mb-2">Verificación 2FA</h1>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            Ingresa el código de 6 dígitos generado por tu aplicación autenticadora (Google Authenticator, Microsoft Authenticator o Authy).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form action={verifyMfaLoginAction} className="space-y-6">
          <Input
            id="code"
            name="code"
            type="text"
            label="Código de Seguridad (6 Dígitos)"
            placeholder="Ej. 123456"
            icon={KeyRound}
            maxLength={6}
            required
            className="text-center font-mono text-xl font-bold tracking-widest"
          />

          <SubmitButton fullWidth className="py-3 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-lg">
            Verificar e Ingresar
          </SubmitButton>
        </form>

        <div className="mt-8 pt-6 border-t border-[#232C26] text-center space-y-2">
          <p className="text-xs text-zinc-500">¿Perdiste tu celular o aplicación autenticadora?</p>
          <Link
            href="/mfa-recovery"
            className="text-xs font-bold text-[#8EA653] hover:text-[#8EA653] transition-colors inline-flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" /> Solicitar Recuperación de 2FA
          </Link>
        </div>

      </div>
    </div>
  );
}
