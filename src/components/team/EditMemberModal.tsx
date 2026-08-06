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

  // REGLAS DE VISIBILIDAD ABSOLUTA PARA ACCIONES:
  // 1. Los empleados no ven botones de edición.
  if (currentUserRole === 'employee') return null;

  // 2. El Propietario (owner) principal no es editable en la gestión de equipo.
  if (member.role === 'owner') return null;

  // 3. Un Administrador NO puede editar a otros Administradores.
  if (currentUserRole === 'admin' && member.role === 'admin') return null;

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-100">Editar Integrante</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Modifica nombre, rol o estado operativo de {member.name}</p>
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

          {/* Email No Editable */}
          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Correo Electrónico (No Modificable)
            </label>
            <div className="relative">
              <input
                type="email"
                value={member.email || 'Sin correo asociado'}
                disabled
                className="block w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 pl-10 text-sm text-zinc-400 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Selección de Rol */}
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
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 pl-10 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
              >
                <option value="employee">Empleado (Acceso Operativo)</option>
                <option value="admin" disabled={currentUserRole !== 'owner'}>
                  Administrador {currentUserRole !== 'owner' ? '(Requiere Propietario)' : ''}
                </option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Estado Operativo */}
          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="status">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
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

          {/* Botones */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <SubmitButton className="px-6 py-2.5 text-xs font-bold shadow-lg">
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
        className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors"
        title="Editar integrante"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
