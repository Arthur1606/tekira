'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Mail, Building2, Shield, Copy, Check, Sparkles, ExternalLink, X } from 'lucide-react';

interface InvitationModalProps {
  token: string;
  email: string;
  role: string;
  storeName: string;
  onClose?: () => void;
}

export function InvitationModal({ token, email, role, storeName, onClose }: InvitationModalProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/invite/${token}` 
    : `/invite/${token}`;

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Card className="p-6 sm:p-8 border-[#7C9A42]/50 bg-gradient-to-br from-[#141A16] to-[#0E1310] relative overflow-hidden shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
      
      {/* Badge Superior */}
      <div className="flex items-center justify-between border-b border-[#232C26] pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#8EA653]" />
          <h3 className="text-lg font-bold text-[#F5F5F0]">Invitación Generada Exitosamente</h3>
        </div>

        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#1E2621] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed">
        El enlace de invitación ha sido generado y estará activo durante <strong>7 días</strong>. Comparte este enlace con el colaborador para que complete su registro y active su token 2FA obligatorio.
      </p>

      {/* Detalles de la Invitación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#0E1310] rounded-2xl border border-[#232C26]">
        
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Mail className="w-3 h-3 text-[#7C9A42]" /> Correo Invitado
          </span>
          <span className="text-xs font-bold text-[#F5F5F0] truncate block font-mono">{email}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#7C9A42]" /> Empresa Destino
          </span>
          <span className="text-xs font-bold text-[#F5F5F0] truncate block">{storeName}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#7C9A42]" /> Rol Asignado
          </span>
          <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40 text-[10px] py-0.5 px-2 uppercase font-mono font-bold">
            {role === 'admin' ? 'Administrador' : 'Empleado'}
          </Badge>
        </div>

      </div>

      {/* Enlace Completo & Botón Copiar */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Enlace Único de Invitación
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="w-full sm:flex-1 relative">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full bg-[#0E1310] border border-[#7C9A42]/40 rounded-xl px-4 py-3 text-xs text-[#8EA653] font-mono font-bold focus:outline-none select-all truncate pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-[#556B2F]/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" /> ¡Enlace Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Enlace
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nota de futura integración SMTP */}
      <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-[#232C26] flex items-center justify-between">
        <span>Prueba manual sin envío de email activo</span>
        <span className="text-[#8EA653]">Servicio SMTP/API listo para integración</span>
      </div>

    </Card>
  );
}
