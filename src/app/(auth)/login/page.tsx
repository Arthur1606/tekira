import Link from 'next/link';
import { login } from '@/modules/auth/actions';
import { Mail, Lock, AlertCircle, Building, KeyRound, ShieldCheck } from 'lucide-react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto space-y-6">
      
      {/* Header Emblem */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-br from-[#556B2F] to-[#3B4B20] rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#556B2F]/20 border border-[#7C9A42]/30">
          <span className="text-[#F5F5F0] font-black text-2xl tracking-tighter">T</span>
        </div>
        <h2 className="text-3xl font-extrabold text-[#F5F5F0] tracking-tight">Iniciar Sesión en TEKIRA</h2>
        <p className="text-xs text-zinc-400">Acceso seguro con autenticación de dos factores (2FA)</p>
      </div>

      {resolvedSearchParams.error && (
        <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}

      <form action={login} className="bg-[#141A16] p-6 sm:p-8 rounded-3xl border border-[#232C26] shadow-2xl space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@empresa.com"
          icon={Mail}
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          icon={Lock}
          required
        />

        <div className="pt-2">
          <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20 border border-[#7C9A42]/30">
            Ingresar al Sistema
          </SubmitButton>
        </div>

        <div className="pt-2 text-center">
          <span className="text-[11px] font-mono text-[#8EA653] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Protección Universal 2FA Requerida
          </span>
        </div>
      </form>

      <div className="pt-4 border-t border-[#1E2621] space-y-3 text-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">¿Aún no formas parte de TEKIRA?</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            href="/signup?mode=owner"
            className="p-3 bg-[#141A16] hover:bg-[#19201C] border border-[#232C26] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#8EA653] hover:text-zinc-100 transition-colors"
          >
            <Building className="w-4 h-4" /> Crear Empresa
          </Link>

          <Link
            href="/signup?mode=join"
            className="p-3 bg-[#141A16] hover:bg-[#19201C] border border-[#232C26] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <KeyRound className="w-4 h-4" /> Unirme con Código
          </Link>
        </div>
      </div>

    </div>
  );
}
