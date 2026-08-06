import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { SignupFormTabs } from './SignupFormTabs';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const initialMode = resolvedSearchParams.mode === 'join' ? 'join' : 'owner';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Registro TEKIRA</h2>
        <p className="text-zinc-400 mt-1 text-sm">Crea una nueva empresa o únete con un código existente</p>
      </div>

      {resolvedSearchParams.error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}

      <SignupFormTabs initialMode={initialMode} />

      <p className="mt-8 text-center text-xs text-zinc-400">
        ¿Ya tienes tu cuenta lista?{' '}
        <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          Inicia sesión aquí
        </Link>
      </p>
    </div>
  );
}
