'use client';

import { useState } from 'react';
import { InvitationData, cancelInvitationAction, regenerateInvitationAction } from '@/modules/invitations/actions';
import { Badge } from '@/components/ui/Badge';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Mail, Copy, Check, RefreshCw, XCircle, Clock, ShieldCheck } from 'lucide-react';

interface StoreInvitationsTableProps {
  invitations: InvitationData[];
}

export function StoreInvitationsTable({ invitations }: StoreInvitationsTableProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tekira.vercel.app';
    const link = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string, isValid: boolean) => {
    switch (status) {
      case 'pending':
        return isValid ? (
          <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/40 font-bold text-xs">
            <Clock className="w-3 h-3 mr-1" /> Pendiente
          </Badge>
        ) : (
          <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-xs">
            <Clock className="w-3 h-3 mr-1" /> Expirada
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold text-xs">
            <Check className="w-3 h-3 mr-1" /> Aceptada
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-xs">
            <Clock className="w-3 h-3 mr-1" /> Expirada
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold text-xs">
            <XCircle className="w-3 h-3 mr-1" /> Cancelada
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-6 border-t border-[#232C26]">
      <div>
        <h3 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#8EA653]" /> Invitaciones de Equipo Enviadas
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">Control de enlaces de acceso pendientes, vigencia y revocación</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#232C26] bg-[#141A16]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#232C26] text-zinc-400 font-bold uppercase tracking-wider bg-[#0E1310]">
              <th className="py-3 px-4">Correo Invitado</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">Fecha Creación</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232C26]">
            {invitations.map((invite) => (
              <tr key={invite.id} className="hover:bg-[#19201C] transition-colors">
                
                <td className="py-4 px-4 font-mono font-bold text-[#F5F5F0]">
                  {invite.email}
                </td>

                <td className="py-4 px-4">
                  <Badge variant="primary" className="bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/30 font-bold">
                    <ShieldCheck className="w-3 h-3 mr-1" /> {invite.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </Badge>
                </td>

                <td className="py-4 px-4 font-mono text-zinc-400 whitespace-nowrap">
                  {formatDate(invite.expires_at)}
                </td>

                <td className="py-4 px-4">
                  {getStatusBadge(invite.status, invite.is_valid)}
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    
                    {/* Botón 1: Copiar Enlace */}
                    {invite.status === 'pending' && invite.is_valid && (
                      <button
                        type="button"
                        onClick={() => copyInviteLink(invite.token)}
                        className="px-3 py-1.5 bg-[#556B2F]/20 hover:bg-[#556B2F]/40 text-[#8EA653] border border-[#7C9A42]/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        {copiedToken === invite.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                          </>
                        )}
                      </button>
                    )}

                    {/* Botón 2: Regenerar Invitación */}
                    <form action={regenerateInvitationAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <SubmitButton
                        variant="secondary"
                        className="py-1.5 px-3 text-xs bg-[#1E2621] hover:bg-[#28332C] text-zinc-300 border border-[#232C26]"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#8EA653]" /> Regenerar
                      </SubmitButton>
                    </form>

                    {/* Botón 3: Cancelar Invitación */}
                    {invite.status === 'pending' && (
                      <form action={cancelInvitationAction}>
                        <input type="hidden" name="invite_id" value={invite.id} />
                        <SubmitButton
                          variant="secondary"
                          className="py-1.5 px-3 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                        </SubmitButton>
                      </form>
                    )}

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
