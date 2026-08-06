import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AuthConfirmPage() {
  return (
    <div className="min-h-screen bg-[#0B0F0D] flex flex-col items-center justify-center p-4 font-sans text-[#F5F5F0] animate-in fade-in duration-500">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <span className="text-3xl font-black tracking-tighter text-[#F5F5F0]">
          TEKIRA<span className="text-[#7C9A42]">●</span>
        </span>
      </div>

      {/* Card de Confirmación */}
      <div className="w-full max-w-md bg-[#0E1310] border border-[#232C26] rounded-2xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0] tracking-tight">Correo Verificado Correctamente</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Tu cuenta ha sido autenticada y confirmada exitosamente. Ya puedes acceder a tu panel de control comercial.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <Link href="/dashboard" className="block w-full">
            <Button fullWidth className="py-3.5 text-sm font-bold shadow-xl shadow-[#556B2F]/20 flex items-center justify-center gap-2">
              <span>Ingresar a TEKIRA</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer System */}
      <p className="mt-8 text-xs font-mono text-zinc-500 text-center">
        TEKIRA Platform System • v0.10.5
      </p>

    </div>
  );
}
