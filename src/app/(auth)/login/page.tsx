import Link from 'next/link';
import { login } from '@/modules/auth/actions';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight">Iniciar Sesión</h2>
      <p className="text-zinc-400 mb-8 text-sm">Ingresa tus credenciales para acceder a tu panel de control.</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form className="space-y-5">
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
          <Button fullWidth formAction={login}>
            Entrar a TEKIRA
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-400">
        ¿Aún no tienes cuenta?{' '}
        <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Crea tu espacio de trabajo
        </Link>
      </p>
    </div>
  );
}
