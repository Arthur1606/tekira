'use client';

import { useState } from 'react';
import { createDemoStoreAction } from '@/modules/superadmin/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { Plus, Building, MapPin, Tag, Mail, X, Sparkles } from 'lucide-react';

export function CreateDemoStoreModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#556B2F] hover:bg-[#7C9A42] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#556B2F]/20"
      >
        <Plus className="w-4 h-4" /> Crear comercio demo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#141A16] rounded-3xl border border-[#232C26] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#232C26] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#556B2F]/20 flex items-center justify-center border border-[#7C9A42]/30">
                <Sparkles className="w-6 h-6 text-[#8EA653]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#F5F5F0]">Crear Comercio Demo</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Genera rápidamente un entorno de prueba para demostraciones comerciales</p>
              </div>
            </div>

            <form action={createDemoStoreAction} className="space-y-4">
              
              <Input
                id="name"
                name="name"
                type="text"
                label="Nombre Comercial Demo *"
                placeholder="Ej. Restaurante La Casona Demo"
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
                      className="block w-full rounded-xl border border-[#232C26] bg-[#0E1310] px-4 py-3 pl-10 text-sm text-[#F5F5F0] focus:border-[#7C9A42] focus:outline-none transition-all appearance-none"
                    >
                      <option value="Restaurante">Restaurante / Cafetería</option>
                      <option value="Tienda de barrio">Tienda de Barrio / Minimercado</option>
                      <option value="Supermercado">Supermercado</option>
                      <option value="Ferretería">Ferretería / Repuestos</option>
                      <option value="Licorería">Licorería</option>
                      <option value="Droguería">Droguería / Farmacia</option>
                      <option value="Tienda de ropa">Tienda de Ropa / Calzado</option>
                      <option value="Tecnología">Tecnología / Miscelánea</option>
                      <option value="Otro">Otro Rubro Demo</option>
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
                  label="Ciudad"
                  placeholder="Ej. Bogotá"
                  defaultValue="Bogotá"
                  icon={MapPin}
                />
              </div>

              <Input
                id="owner_email"
                name="owner_email"
                type="email"
                label="Correo Propietario Demo (Opcional)"
                placeholder="demo@empresa.com"
                icon={Mail}
              />

              <div className="p-3.5 bg-[#556B2F]/15 rounded-xl border border-[#7C9A42]/30 text-xs text-[#8EA653] font-medium leading-relaxed">
                ✨ El comercio se creará automáticamente con el <strong>Plan Enterprise Piloto (90 días)</strong> activo e ilimitado.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-3 bg-[#1E2621] hover:bg-[#28332C] text-zinc-300 text-xs font-bold rounded-xl border border-[#232C26]"
                >
                  Cancelar
                </button>
                <SubmitButton fullWidth className="w-1/2 py-3 text-xs font-bold bg-[#556B2F] hover:bg-[#7C9A42] text-[#F5F5F0] shadow-xl shadow-[#556B2F]/20">
                  Crear Comercio Demo
                </SubmitButton>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
