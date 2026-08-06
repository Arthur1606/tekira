'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { updateTeamMember } from '@/modules/team/actions';
import { Edit2, X, UserCheck, Shield, Lock, AlertCircle } from 'lucide-react';

interface TeamMemberItem {
  id: string;
  name: string;
  email: string | null;
  role: 'owner' | 'admin' | 'employee';
  status: 'active' | 'inactive';
}

interface EditMemberModalProps {
  member: TeamMemberItem;
  currentUserRole: 'owner' | 'admin' | 'employee';
}

export function EditMemberModal({ member, currentUserRole }: EditMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<'admin' | 'employee'>(member.role === 'admin' ? 'admin' : 'employee');
  const [status, setStatus] = useState<'active' | 'inactive'>(member.status);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (currentUserRole === 'employee') return null;
  if (member.role === 'owner') return null;
  if (currentUserRole === 'admin' && member.role === 'admin') return null;

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141A16] border border-[#232C26] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#232C26] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#556B2F]/20 border border-[#7C9A42]/30 rounded-2xl flex items-center justify-center text-[#8EA653]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F0]">Editar Integrante</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Modifica nombre, rol o estado operativo de {member.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-400 hover:text-[#F5F5F0] hover:bg-[#19201C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={updateTeamMember} className="space-y-5">
          <input type="hidden" name="member_id" value={member.id} />

          <Input
            id="name"
            name="name"
            type="text"
            label="Nombre Completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Correo Electrónico (No Modificable)
            </label>
            <div className="relative">
              <input
                type="email"
                value={member.email || 'Sin correo asociado'}
                disabled
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-zinc-400 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="role">
              Rol en el Comercio
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="block w-full rounded-xl border border-[#232C26] bg-[#0B0F0D] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all appearance-none"
              >
                <option value="employee">Empleado (Acceso Operativo)</option>
                <option value="admin" disabled={currentUserRole !== 'owner'}>
                  Administrador {currentUserRole !== 'owner' ? '(Requiere Propietario)' : ''}
                </option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C9A42]">
                <Shield className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="status">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="block w-full rounded-xl border border-[#232C26] bg-[#0B0F0D] px-4 py-3 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all appearance-none"
            >
              <option value="active">Activo (Puede operar)</option>
              <option value="inactive">Inactivo / Bloqueado (Acceso denegado)</option>
            </select>
          </div>

          {status === 'inactive' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">Al inactivar/bloquear al integrante no podrá ingresar ni realizar ventas. Sus registros e historial de movimientos se conservarán intactos.</p>
            </div>
          )}

          <div className="pt-4 border-t border-[#232C26] flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-xs font-bold"
            >
              Cancelar
            </Button>
            <SubmitButton className="px-6 py-2.5 text-xs font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-lg">
              Guardar Cambios
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
        className="p-2 rounded-xl bg-[#141A16] hover:bg-[#19201C] border border-[#232C26] text-zinc-300 hover:text-[#F5F5F0] transition-colors"
        title="Editar integrante"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
