'use client';

import { createInvitationAction } from '@/modules/invitations/actions';
import { Card } from '@/components/ui/Card';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { TEAM_ROLES } from '@/modules/team/types';
import { ArrowLeft, Mail, Shield, AlertTriangle, Send } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function NewTeamMemberPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [selectedRole, setSelectedRole] = useState('employee');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex items-center gap-4">
        <Link href="/team" className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#19201C] rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Invitar Empleado o Colaborador</h1>
          <p className="text-sm text-zinc-400">Genera un enlace de invitación seguro para vincular a tu equipo</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{error}</p>
          </div>
        )}

        <div className="p-4 bg-[#556B2F]/15 border border-[#7C9A42]/30 rounded-2xl text-xs text-[#8EA653] leading-relaxed">
          <p className="font-bold text-[#F5F5F0] mb-1">Sistema de Invitaciones Controladas:</p>
          <p>
            Al enviar una invitación se generará un enlace único con 7 días de vigencia. El usuario invitado deberá completar su registro desde ese enlace y configurar su token de seguridad 2FA obligatorio.
          </p>
        </div>

        <form action={createInvitationAction} className="space-y-6">
          
          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico del Empleado *"
            placeholder="empleado@empresa.com"
            icon={Mail}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="role">
              Rol Asignado en el Negocio *
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none appearance-none capitalize font-bold"
              >
                {TEAM_ROLES.filter(r => r !== 'owner').map(role => (
                  <option key={role} value={role} className="capitalize">
                    {role === 'admin' ? 'Administrador (Acceso Amplio)' : 'Empleado (Operativo)'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C9A42]">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Los administradores pueden gestionar ventas e inventarios. Los empleados operan ventas diarias.
            </p>
          </div>

          {selectedRole === 'admin' && (
            <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-300">Confirmación de Rol Administrativo</h4>
                  <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
                    Solo el propietario principal (Owner) puede otorgar invitaciones con rol de Administrador.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#232C26]">
            <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20">
              <Send className="w-4 h-4 mr-2" /> Generar Enlace de Invitación
            </SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
