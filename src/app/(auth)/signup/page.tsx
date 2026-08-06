import Link from 'next/link';
import { signup } from '@/modules/auth/actions';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight">Crear Cuenta</h2>
      <p className="text-zinc-400 mb-8 text-sm">Comienza a evolucionar tu negocio hoy mismo.</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form className="space-y-5">
        <Input
          id="name"
          name="name"
          type="text"
          label="Nombre Completo"
          placeholder="Ej. Ana García"
          icon={User}
          required
        />

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
          label="Contraseña segura"
          placeholder="Mínimo 6 caracteres"
          icon={Lock}
          required
          minLength={6}
        />

        <div className="pt-2">
          <Button fullWidth formAction={signup}>
            Registrarse y Continuar
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-400">
        ¿Ya tienes tu cuenta lista?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
