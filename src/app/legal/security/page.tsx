import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, Key, Server, Cpu } from 'lucide-react';

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            TEKIRA v0.12.0
          </span>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Arquitectura y Política de Seguridad Empresarial</h1>
          <p className="text-sm text-zinc-400">
            Mecanismos de protección de datos, aislamiento multiempresa y autenticación 2FA TOTP.
          </p>
        </div>

        {/* Content */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-zinc-300 leading-relaxed shadow-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-zinc-100">Autenticación Obligatoria 2FA TOTP</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Todo usuario (Owner, Admin, Employee) requiere autenticación de dos factores basada en tiempo (RFC 6238) con secretos Base32 encriptados.
              </p>
            </div>

            <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-zinc-100">Aislamiento RLS Multi-Tenant</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Políticas estrictas de nivel de fila (Row Level Security en PostgreSQL) que garantizan que los datos de un comercio nunca puedan ser accedidos por otro.
              </p>
            </div>

            <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-zinc-100">Código Único de Empleado</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identificador inmutable `TKR-EMP-XXXXXX` asignado automáticamente en Postgres para auditoría no modificable de ventas y movimientos.
              </p>
            </div>

            <div className="p-5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-zinc-100">Retiro Seguro (Soft Delete)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Las eliminaciones del catálogo preservan intacto el 100% del historial de auditoría de ventas, mermas y costos comerciales.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>TEKIRA Security Standard</span>
            <span>Versión 0.12.0</span>
          </div>

        </div>

      </div>
    </div>
  );
}
