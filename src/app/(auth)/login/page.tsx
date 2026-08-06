import Link from 'next/link';
import { login } from '@/modules/auth/actions';
import { Mail, Lock, AlertCircle, Building, KeyRound } from 'lucide-react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Iniciar Sesión</h2>
        <p className="text-zinc-400 mt-1 text-sm">Accede a tu panel de control comercial</p>
      </div>

      {resolvedSearchParams.error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}

      <form action={login} className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@correo.com"
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
          <SubmitButton fullWidth className="py-3.5 text-sm font-bold shadow-xl shadow-indigo-600/20">
            Entrar a TEKIRA
          </SubmitButton>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3 text-center">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">¿Aún no formas parte de TEKIRA?</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            href="/signup?mode=owner"
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Building className="w-4 h-4" /> Crear Empresa
          </Link>

          <Link
            href="/signup?mode=join"
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <KeyRound className="w-4 h-4" /> Unirme con Código
          </Link>
        </div>
      </div>
    </div>
  );
}
