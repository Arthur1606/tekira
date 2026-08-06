import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Users, Phone, Mail, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { getSuppliers } from '@/modules/purchases/services';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const suppliers = await getSuppliers(activeStore.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Feedback Messages */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.error}</p>
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
          <p>{resolvedSearchParams.success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F5F0] tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-[#7C9A42]" /> Proveedores
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Gestiona tu red de abastecimiento comercial
          </p>
        </div>
        <Link href="/dashboard/suppliers/new">
          <Button className="w-full sm:w-auto shadow-sm">
            <Plus className="w-5 h-5 mr-1.5 -ml-1" /> Nuevo Proveedor
          </Button>
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tienes proveedores registrados"
          description="Construye el directorio de contactos comerciales de tu negocio para asociar facturas de entrada e historial de abastecimiento."
          actionLabel="Crear Primer Proveedor"
          actionHref="/dashboard/suppliers/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="group hover:border-[#7C9A42]/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#F5F5F0] group-hover:text-[#8EA653] transition-colors">{supplier.name}</h3>
                {supplier.category && (
                  <Badge variant="neutral">{supplier.category}</Badge>
                )}
              </div>
              
              <div className="space-y-3 mt-6">
                {supplier.phone && (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
                {!supplier.phone && !supplier.email && !supplier.address && (
                  <p className="text-sm text-zinc-600 italic">Sin datos de contacto adicionales</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
