import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { ArrowLeft, User, Phone, Mail, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import { createSupplier } from '@/modules/purchases/actions';

export default function NewSupplierPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/suppliers" className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nuevo Proveedor</h1>
          <p className="text-sm text-zinc-400 mt-1">Registra los datos para futuras compras</p>
        </div>
      </div>

      <Card>
        <form action={createSupplier} className="space-y-6">
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nombre Comercial o Empresa"
              placeholder="Ej. Distribuidora ABC"
              icon={User}
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="phone"
                name="phone"
                label="Teléfono"
                placeholder="Ej. 300 123 4567"
                icon={Phone}
                type="tel"
              />
              <Input
                id="email"
                name="email"
                label="Correo Electrónico"
                placeholder="Ej. ventas@abc.com"
                icon={Mail}
                type="email"
              />
            </div>

            <Input
              id="address"
              name="address"
              label="Dirección"
              placeholder="Ej. Calle 123 # 45-67"
              icon={MapPin}
            />

            <Input
              id="category"
              name="category"
              label="Categoría de Proveedor"
              placeholder="Ej. Textiles, Aseo, Tecnología"
              icon={Tag}
            />
          </div>

          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <Link href="/dashboard/suppliers">
              <span className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-zinc-300 font-medium rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800">
                Cancelar
              </span>
            </Link>
            <SubmitButton>Guardar Proveedor</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
