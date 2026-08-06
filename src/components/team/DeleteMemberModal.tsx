'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { deleteTeamMember } from '@/modules/team/actions';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteMemberModalProps {
  member: {
    id: string;
    name: string;
    role: string;
  };
  currentUserRole: 'owner' | 'admin' | 'employee';
}

export function DeleteMemberModal({ member, currentUserRole }: DeleteMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Regla de Visibilidad Absoluta:
  // Solo el OWNER puede ver el botón de eliminar, y NUNCA se muestra para el registro del propio OWNER
  if (currentUserRole !== 'owner' || member.role === 'owner') {
    return null;
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Eliminar Integrante</h3>
              <p className="text-xs text-zinc-400">Confirmación de eliminación definitiva</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          ¿Estás seguro de eliminar a <strong className="text-zinc-100">{member.name}</strong> del equipo? Esta acción removerá su acceso de forma definitiva.
        </p>

        <form action={deleteTeamMember} className="space-y-4">
          <input type="hidden" name="member_id" value={member.id} />

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <SubmitButton className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20">
              Eliminar Integrante
            </SubmitButton>
          </div>
        </form>

      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-zinc-900/80 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-colors"
        title="Eliminar integrante definitivamente"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
