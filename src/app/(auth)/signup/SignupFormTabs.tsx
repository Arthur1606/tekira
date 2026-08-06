'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signupOwner, joinCompany } from '@/modules/auth/actions';
import { Mail, Lock, User, Building, KeyRound, Tag, MapPin, Scale } from 'lucide-react';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';

interface SignupFormTabsProps {
  initialMode?: 'owner' | 'join';
}

export function SignupFormTabs({ initialMode = 'owner' }: SignupFormTabsProps) {
  const [mode, setMode] = useState<'owner' | 'join'>(initialMode);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Selector de Modo */}
      <div className="grid grid-cols-2 p-1 bg-[#141A16] border border-[#232C26] rounded-2xl">
        <button
          type="button"
          onClick={() => setMode('owner')}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            mode === 'owner'
              ? 'bg-[#556B2F] text-[#F5F5F0] shadow-lg shadow-[#556B2F]/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building className="w-4 h-4 text-[#7C9A42]" /> Crear Empresa
        </button>

        <button
          type="button"
          onClick={() => setMode('join')}
          className={`flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            mode === 'join'
              ? 'bg-[#556B2F] text-[#F5F5F0] shadow-lg shadow-[#556B2F]/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-4 h-4 text-[#7C9A42]" /> Unirme a Empresa
        </button>
      </div>

      {/* MODO 1: CREAR NUEVA EMPRESA */}
      {mode === 'owner' ? (
        <form action={signupOwner} className="bg-[#141A16] p-6 sm:p-8 rounded-3xl border border-[#232C26] shadow-2xl space-y-5">
          <div className="p-3.5 bg-[#556B2F]/15 border border-[#7C9A42]/30 rounded-xl text-xs text-[#8EA653] font-medium leading-relaxed">
            Registra tu negocio como <strong>Propietario Principal</strong>. Se generará automáticamente tu <strong>Código de Empresa</strong> para invitar a tu equipo.
          </div>

          <Input
            id="store_name"
            name="store_name"
            type="text"
            label="Nombre Comercial de la Empresa"
            placeholder="Ej. Tienda María, Distribuidora San José"
            icon={Building}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5" htmlFor="category">
                Categoría del Negocio
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  defaultValue="Tienda de barrio"
                  className="block w-full rounded-xl border border-[#232C26] bg-[#0B0F0D] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none focus:ring-2 focus:ring-[#7C9A42]/30 transition-all appearance-none"
                >
                  <option value="Restaurante">Restaurante / Cafetería</option>
                  <option value="Tienda de barrio">Tienda de Barrio / Minimercado</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Ferretería">Ferretería / Repuestos</option>
                  <option value="Licorería">Licorería</option>
                  <option value="Droguería">Droguería / Farmacia</option>
                  <option value="Tienda de ropa">Tienda de Ropa / Calzado</option>
                  <option value="Tecnología">Tecnología / Miscelánea</option>
                  <option value="Otro">Otro Rubro</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7C9A42]">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
            </div>

            <Input
              id="city"
              name="city"
              type="text"
              label="Ciudad / Ubicación"
              placeholder="Ej. Bogotá, Medellín"
              icon={MapPin}
            />
          </div>

          <Input
            id="name"
            name="name"
            type="text"
            label="Tu Nombre Completo (Propietario)"
            placeholder="Ej. María Rodríguez"
            icon={User}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico Principal"
            placeholder="propietario@empresa.com"
            icon={Mail}
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            icon={Lock}
            required
            minLength={6}
          />

          {/* CHECKBOX DE ACEPTACIÓN LEGAL OBLIGATORIA */}
          <div className="p-3 bg-[#0B0F0D] border border-[#232C26] rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                name="terms_accepted"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-[#7C9A42] focus:ring-[#7C9A42] shrink-0"
              />
              <span className="leading-snug">
                Acepto los{' '}
                <Link href="/legal/terms" target="_blank" className="text-[#8EA653] underline hover:text-zinc-100 font-bold">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-[#8EA653] underline hover:text-zinc-100 font-bold">
                  Política de Privacidad
                </Link>{' '}
                de TEKIRA (v0.12.0).
              </span>
            </label>
          </div>

          <div className="pt-2">
            <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20">
              Crear Empresa y Continuar
            </SubmitButton>
          </div>
        </form>
      ) : (
        /* MODO 2: UNIRSE A EMPRESA EXISTENTE */
        <form action={joinCompany} className="bg-[#141A16] p-6 sm:p-8 rounded-3xl border border-[#232C26] shadow-2xl space-y-5">
          <div className="p-3.5 bg-[#556B2F]/15 border border-[#7C9A42]/30 rounded-xl text-xs text-[#8EA653] font-medium leading-relaxed">
            Ingresa el <strong>Código de Empresa</strong> proporcionado por tu Administrador o Propietario (ej. <strong>TEK-83921</strong>) para vincularte a su equipo.
          </div>

          <Input
            id="company_code"
            name="company_code"
            type="text"
            label="Código de Empresa"
            placeholder="Ej. TEK-83921 o MAR-48291"
            icon={KeyRound}
            required
            className="uppercase font-mono tracking-wider font-bold text-[#8EA653] placeholder:text-zinc-600 placeholder:font-normal placeholder:tracking-normal"
          />

          <Input
            id="name"
            name="name"
            type="text"
            label="Tu Nombre Completo"
            placeholder="Ej. Carlos Mendoza"
            icon={User}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Correo Electrónico"
            placeholder="carlos@gmail.com"
            icon={Mail}
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            icon={Lock}
            required
            minLength={6}
          />

          {/* CHECKBOX DE ACEPTACIÓN LEGAL OBLIGATORIA */}
          <div className="p-3 bg-[#0B0F0D] border border-[#232C26] rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                name="terms_accepted"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-[#7C9A42] focus:ring-[#7C9A42] shrink-0"
              />
              <span className="leading-snug">
                Acepto los{' '}
                <Link href="/legal/terms" target="_blank" className="text-[#8EA653] underline hover:text-zinc-100 font-bold">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/legal/privacy-policy" target="_blank" className="text-[#8EA653] underline hover:text-zinc-100 font-bold">
                  Política de Privacidad
                </Link>{' '}
                de TEKIRA (v0.12.0).
              </span>
            </label>
          </div>

          <div className="pt-2">
            <SubmitButton fullWidth className="py-3.5 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20">
              Unirme a la Empresa
            </SubmitButton>
          </div>
        </form>
      )}

    </div>
  );
}
