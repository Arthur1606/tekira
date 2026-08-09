import { Card } from '@/components/ui/Card';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { ArrowLeft, ShoppingBag, User, Phone, FileText, Lock, Calendar, CreditCard, ShieldCheck, History, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { createClient } from '@/lib/supabase/server';
import { updateSaleMetadata, updateSaleStatus, deleteSale } from '@/modules/sales/actions';
import { redirect } from 'next/navigation';

export default async function SaleDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id: saleId } = await params;
  const resolvedSearchParams = await searchParams;

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const supabase = await createClient();

  // 1. Cargar datos de la venta
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .eq('store_id', activeStore.id)
    .single();

  if (saleErr || !sale) {
    redirect('/sales/team-performance?error=Venta no encontrada.');
  }

  // 2. Cargar items de la venta
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('*, product:products(name), variant:product_variants(name)')
    .eq('sale_id', saleId);

  // 3. Cargar auditoría de cambios
  const { data: auditLogs } = await supabase
    .from('sale_audit_logs')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false });

  // 4. Cargar rol del usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = activeStore.owner_id === user?.id;

  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('store_id', activeStore.id)
    .eq('user_id', user?.id)
    .maybeSingle();

  const userRole = isOwner ? 'owner' : (member?.role || 'employee');
  const canEdit = userRole === 'owner' || userRole === 'admin';

  const formatCOP = (amount: number) => '$' + new Intl.NumberFormat('es-CO').format(amount || 0);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#141A16] backdrop-blur-2xl rounded-2xl border border-white/[0.03]">
        <div className="flex items-center gap-4">
          <Link href="/sales/team-performance" className="p-3 bg-[#141A16] hover:bg-[#19201C] rounded-xl text-zinc-400 hover:text-[#F5F5F0] transition-colors border border-[#232C26] shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F0] tracking-tight">
                Venta {sale.sale_number || `#${sale.id.slice(0, 8)}`}
              </h1>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                {sale.status?.toUpperCase() || 'COMPLETADA'}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-400 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8EA653]" /> {formatDate(sale.created_at)} — {activeStore.name}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {resolvedSearchParams.error && (
        <div className="p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl text-sm font-medium">
          {resolvedSearchParams.error}
        </div>
      )}
      {resolvedSearchParams.success && (
        <div className="p-4 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 rounded-xl text-sm font-medium">
          {resolvedSearchParams.success}
        </div>
      )}

      {/* Selector de Estado de la Operación Comercial (Pendiente vs Entregado) */}
      <Card noPadding className="p-5 bg-[#141A16] border border-[#232C26]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estado de la Operación Comercial</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-base font-black px-3 py-1 rounded-full border ${
                (sale.status || 'pendiente') === 'entregado'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {(sale.status || 'pendiente') === 'entregado' ? '🟢 Entregado' : '🟡 Pendiente'}
              </span>
              <p className="text-xs text-zinc-400">
                {(sale.status || 'pendiente') === 'entregado' ? 'Pedido completado y entregado al cliente.' : 'Pedido pendiente por entregar / despacho.'}
              </p>
            </div>
          </div>

          <form action={updateSaleStatus} className="flex items-center gap-2 w-full sm:w-auto">
            <input type="hidden" name="sale_id" value={sale.id} />
            <select
              name="status"
              defaultValue={sale.status || 'pendiente'}
              className="bg-[#0E1310] border border-[#232C26] rounded-xl px-4 py-2 text-sm text-[#F5F5F0] font-bold focus:outline-none"
            >
              <option value="pendiente">🟡 Pendiente</option>
              <option value="entregado">🟢 Entregado</option>
            </select>
            <SubmitButton className="px-4 py-2 text-xs font-bold bg-[#556B2F] hover:bg-[#7C9A42] shrink-0">
              Actualizar Estado
            </SubmitButton>
          </form>
        </div>
      </Card>

      {/* Resumen Inmutable Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#141A16] border border-[#232C26]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Monto Total (Inmutable)</span>
          <p className="text-2xl font-black text-[#8EA653] mt-1">{formatCOP(sale.total_amount)}</p>
        </Card>

        <Card className="p-4 bg-[#141A16] border border-[#232C26]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Método de Pago</span>
          <p className="text-lg font-bold text-[#F5F5F0] mt-1 capitalize">{sale.payment_method}</p>
        </Card>

        <Card className="p-4 bg-[#141A16] border border-[#232C26]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Código Empleado</span>
          <p className="text-lg font-bold text-[#8EA653] font-mono mt-1">{sale.employee_code || 'TKR-EMP-000001'}</p>
        </Card>

        <Card className="p-4 bg-[#141A16] border border-[#232C26]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tipo de Operación</span>
          <p className="text-lg font-bold text-[#F5F5F0] mt-1 capitalize">{sale.sale_type || 'Mostrador'}</p>
        </Card>
      </div>

      {/* Detalle de Productos Vendidos */}
      <Card noPadding className="p-6 bg-[#141A16] border border-[#232C26]">
        <h3 className="text-base font-bold text-[#F5F5F0] mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#8EA653]" /> Artículos Vendidos en esta Transacción
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#F5F5F0]">
            <thead className="bg-[#0E1310] text-xs font-bold uppercase text-zinc-400 border-b border-[#232C26]">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-right">Precio Unitario</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232C26]">
              {saleItems && saleItems.length > 0 ? (
                saleItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#19201C] transition-colors">
                    <td className="px-4 py-3.5 font-bold">{item.product?.name || 'Producto del Catálogo'}</td>
                    <td className="px-4 py-3.5 text-zinc-400">{item.variant?.name || 'Estándar'}</td>
                    <td className="px-4 py-3.5 text-center font-bold">{item.quantity}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-300">{formatCOP(item.unit_price)}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-[#8EA653]">{formatCOP(item.subtotal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    Sin detalle de líneas registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Formulario de Edición Controlada de Datos Administrativos */}
      <Card noPadding className="p-6 bg-[#141A16] border border-[#232C26]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#F5F5F0] flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-[#8EA653]" /> Información Comercial y Notas (Edición Controlada)
          </h3>
          {!canEdit && (
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" /> Modo Lectura (Empleado)
            </span>
          )}
        </div>

        <form action={updateSaleMetadata} className="space-y-4">
          <input type="hidden" name="sale_id" value={sale.id} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nombre del Cliente</label>
              <input
                type="text"
                name="customer_name"
                defaultValue={sale.customer_name || ''}
                disabled={!canEdit}
                placeholder="Ej. María Gómez"
                className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F0] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Teléfono Cliente</label>
              <input
                type="text"
                name="customer_phone"
                defaultValue={sale.customer_phone || ''}
                disabled={!canEdit}
                placeholder="Ej. 300 123 4567"
                className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F0] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Tipo de Venta</label>
              <select
                name="sale_type"
                defaultValue={sale.sale_type || 'mostrador'}
                disabled={!canEdit}
                className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F0] disabled:opacity-60 capitalize"
              >
                <option value="mostrador">Mostrador / Presencial</option>
                <option value="pedido">Pedido / Encargo</option>
                <option value="domicilio">Domicilio / Entrega</option>
                <option value="encargo">Encargo Especial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Observaciones Comercial (Ej. Detalles del pedido)</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={sale.notes || ''}
              disabled={!canEdit}
              placeholder="Ej. Torta cumpleaños 20 personas - entrega viernes 5 PM..."
              className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl p-3 text-sm text-[#F5F5F0] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Nota Interna (Sólo vista por la empresa)</label>
            <textarea
              name="internal_notes"
              rows={2}
              defaultValue={sale.internal_notes || ''}
              disabled={!canEdit}
              placeholder="Ej. Cliente frecuente del negocio..."
              className="w-full bg-[#0E1310] border border-[#232C26] rounded-xl p-3 text-sm text-[#F5F5F0] disabled:opacity-60"
            />
          </div>

          {canEdit && (
            <div className="pt-2 flex justify-end">
              <SubmitButton className="px-6 py-2.5 text-sm font-bold bg-[#556B2F] hover:bg-[#7C9A42]">
                Guardar Cambios Administrativos
              </SubmitButton>
            </div>
          )}
        </form>
      </Card>

      {/* Historial de Auditoría de Cambios */}
      <Card noPadding className="p-6 bg-[#141A16] border border-[#232C26]">
        <h3 className="text-base font-bold text-[#F5F5F0] mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-[#8EA653]" /> Historial de Modificaciones Administrativas
        </h3>

        {auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-3 bg-[#0E1310] border border-[#232C26] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-bold text-[#F5F5F0]">{log.user_email || 'Usuario de la empresa'}</span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
                <p className="text-zinc-300">
                  Modificó <strong className="text-[#8EA653]">{log.field_name}</strong>
                </p>
                <div className="flex gap-4 text-zinc-400">
                  <span>Antes: <span className="text-rose-400">{log.old_value || 'Vacio'}</span></span>
                  <span>Después: <span className="text-emerald-400">{log.new_value || 'Vacio'}</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">No se han realizado modificaciones administrativas en esta venta.</p>
        )}
      </Card>

      {/* Zona de Control Exclusiva para OWNER: Eliminar Operación Comercial */}
      {isOwner && (
        <Card noPadding className="p-6 bg-rose-950/20 border border-rose-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Eliminar Operación Comercial (Exclusivo Propietario)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Esta acción eliminará la venta <strong className="text-white">{sale.sale_number || `#${sale.id.slice(0, 8)}`}</strong>, cancelará los registros de caja y devolverá automáticamente las cantidades vendidas al stock de inventario.
              </p>
            </div>

            <form action={deleteSale}>
              <input type="hidden" name="sale_id" value={sale.id} />
              <SubmitButton className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg">
                Eliminar Venta y Restaurar Inventario
              </SubmitButton>
            </form>
          </div>
        </Card>
      )}

    </div>
  );
}
