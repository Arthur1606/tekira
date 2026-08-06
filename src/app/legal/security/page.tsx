import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, Key, Server, Cpu } from 'lucide-react';

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F0D] text-[#F5F5F0] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232C26] pb-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-[#F5F5F0] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <span className="text-xs font-mono font-bold text-[#8EA653] bg-[#556B2F]/10 px-3 py-1 rounded-full border border-[#7C9A42]/30">
            TEKIRA v0.12.0
          </span>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 bg-[#556B2F]/20 text-[#8EA653] rounded-2xl flex items-center justify-center border border-[#7C9A42]/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Arquitectura y Política de Seguridad Empresarial</h1>
          <p className="text-sm text-zinc-400">
            Mecanismos de protección de datos, aislamiento multiempresa y autenticación 2FA TOTP.
          </p>
        </div>

        {/* Content */}
        <div className="bg-[#0E1310] border border-[#232C26] rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-zinc-300 leading-relaxed shadow-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#141A16] rounded-2xl border border-[#232C26] space-y-2">
              <Key className="w-5 h-5 text-[#8EA653]" />
              <h3 className="font-bold text-[#F5F5F0]">Autenticación Obligatoria 2FA TOTP</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Todo usuario (Owner, Admin, Employee) requiere autenticación de dos factores basada en tiempo (RFC 6238) con secretos Base32 encriptados.
              </p>
            </div>

            <div className="p-5 bg-[#141A16] rounded-2xl border border-[#232C26] space-y-2">
              <Server className="w-5 h-5 text-[#8EA653]" />
              <h3 className="font-bold text-[#F5F5F0]">Aislamiento RLS Multi-Tenant</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Políticas estrictas de nivel de fila (Row Level Security en PostgreSQL) que garantizan que los datos de un comercio nunca puedan ser accedidos por otro.
              </p>
            </div>

            <div className="p-5 bg-[#141A16] rounded-2xl border border-[#232C26] space-y-2">
              <Cpu className="w-5 h-5 text-[#8EA653]" />
              <h3 className="font-bold text-[#F5F5F0]">Código Único de Empleado</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identificador inmutable `TKR-EMP-XXXXXX` asignado automáticamente en Postgres para auditoría no modificable de ventas y movimientos.
              </p>
            </div>

            <div className="p-5 bg-[#141A16] rounded-2xl border border-[#232C26] space-y-2">
              <ShieldCheck className="w-5 h-5 text-[#8EA653]" />
              <h3 className="font-bold text-[#F5F5F0]">Retiro Seguro (Soft Delete)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Las eliminaciones del catálogo preservan intacto el 100% del historial de auditoría de ventas, mermas y costos comerciales.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#232C26] flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>TEKIRA Security Standard</span>
            <span>Versión 0.12.0</span>
          </div>

        </div>

      </div>
    </div>
  );
}
