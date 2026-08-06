'use client';

import { addTeamMember } from '@/modules/team/actions';
import { Card } from '@/components/ui/Card';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { TEAM_ROLES } from '@/modules/team/types';
import { ArrowLeft, User, Mail, Shield, AlertTriangle } from 'lucide-react';
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
        <Link href="/team" className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nuevo Miembro</h1>
          <p className="text-sm text-zinc-400">Agrega una persona a la operación de tu negocio</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{error}</p>
          </div>
        )}

        <form action={addTeamMember} className="space-y-6">
          
          <Input
            id="name"
            name="name"
            type="text"
            label="Nombre Completo"
            placeholder="Ej. Juan Pérez"
            icon={User}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico (Opcional)"
            placeholder="juan@ejemplo.com"
            icon={Mail}
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="role">
              Rol en el negocio
            </label>
            <div className="relative">
              <select
                id="role"
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 pl-10 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm appearance-none capitalize"
              >
                {TEAM_ROLES.filter(r => r !== 'owner').map(role => (
                  <option key={role} value={role} className="capitalize">
                    {role === 'admin' ? 'Administrador (Admin)' : 'Empleado regular'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Shield className="w-5 h-5" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Los roles por ahora son informativos. Más adelante definirán qué puede ver cada usuario.
            </p>
          </div>

          {selectedRole === 'admin' && (
            <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-300">¡Advertencia de Seguridad!</h4>
                  <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
                    Este rol tendrá acceso administrativo al comercio. Podrá gestionar finanzas, inventario y otras configuraciones críticas.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Input
                  id="admin_confirmation"
                  name="admin_confirmation"
                  type="text"
                  label="Escribe CONFIRMAR para autorizar"
                  placeholder="CONFIRMAR"
                  required={selectedRole === 'admin'}
                  className="border-rose-500/30 focus:border-rose-500/50 focus:ring-rose-500/50"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800">
            <SubmitButton fullWidth className="py-3 text-base">
              Agregar Miembro
            </SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
