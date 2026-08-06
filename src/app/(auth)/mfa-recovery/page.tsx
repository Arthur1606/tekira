import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { requestMfaReset } from '@/modules/security/mfaActions';
import { Lock, Mail, Building, FileText, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function MfaRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F0D] font-sans p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#556B2F]/15 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-[#141A16] backdrop-blur-md rounded-3xl shadow-2xl border border-[#232C26] p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Header Setup */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/login" className="p-2 bg-zinc-800 hover:bg-[#19201C] text-zinc-300 rounded-xl transition-colors border border-zinc-700">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#F5F5F0] tracking-tight">Recuperación de 2FA</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Solicita el restablecimiento de tu autenticador a tu empresa</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <form action={requestMfaReset} className="space-y-5">
          <Input
            id="company_code"
            name="company_code"
            type="text"
            label="Código de la Empresa"
            placeholder="Ej. TEK-12345"
            icon={Building}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Tu Correo Electrónico Registrado"
            placeholder="colaborador@empresa.com"
            icon={Mail}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="reason">
              Motivo de la Solicitud
            </label>
            <div className="relative w-full">
              <textarea
                id="reason"
                name="reason"
                rows={3}
                required
                placeholder="Ej. Cambié de teléfono celular y no respaldé los códigos de autenticación."
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] p-3.5 text-sm text-[#F5F5F0] placeholder-zinc-500 focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-2">
            <SubmitButton fullWidth className="py-3 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-lg">
              Enviar Solicitud a Administración
            </SubmitButton>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
          Por razones de seguridad, el restablecimiento requiere la aprobación del <strong>Propietario o Administrador</strong> de tu empresa.
        </div>

      </div>
    </div>
  );
}
