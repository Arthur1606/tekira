'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function updateSaleMetadata(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const saleId = (formData.get('sale_id') as string || '').trim();
  if (!saleId) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Identificador de venta no válido.')}`);
  }

  // 2. Control estricto de roles: Únicamente Owner y Admin pueden editar metadatos administrativos
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'UPDATE_SALE_METADATA');
  } catch (err: any) {
    redirect(`/sales/${saleId}?error=${encodeURIComponent('Los empleados únicamente pueden visualizar sus ventas. No tienen permiso para modificar datos.')}`);
  }

  // 3. Obtener venta existente para comparar campos inmutables vs campos permitidos
  const { data: existingSale, error: fetchErr } = await supabase
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .eq('store_id', activeStore.id)
    .single();

  if (fetchErr || !existingSale) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Venta no encontrada.')}`);
  }

  // 4. Extraer campos PERMITIDOS para edición (NUNCA tocar total_amount, payment_method, etc.)
  const customerName = (formData.get('customer_name') as string || '').trim();
  const customerPhone = (formData.get('customer_phone') as string || '').trim();
  const notes = (formData.get('notes') as string || '').trim();
  const internalNotes = (formData.get('internal_notes') as string || '').trim();
  const saleType = (formData.get('sale_type') as string || 'mostrador').trim();

  // 5. Comparar cambios y registrar auditoría en sale_audit_logs
  const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];

  if ((existingSale.customer_name || '') !== customerName) {
    changes.push({ field: 'Nombre Cliente', oldVal: existingSale.customer_name || 'Sin especificar', newVal: customerName || 'Sin especificar' });
  }
  if ((existingSale.customer_phone || '') !== customerPhone) {
    changes.push({ field: 'Teléfono Cliente', oldVal: existingSale.customer_phone || 'Sin especificar', newVal: customerPhone || 'Sin especificar' });
  }
  if ((existingSale.notes || '') !== notes) {
    changes.push({ field: 'Observaciones', oldVal: existingSale.notes || 'Sin observaciones', newVal: notes || 'Sin observaciones' });
  }
  if ((existingSale.internal_notes || '') !== internalNotes) {
    changes.push({ field: 'Nota Interna', oldVal: existingSale.internal_notes || 'Sin nota interna', newVal: internalNotes || 'Sin nota interna' });
  }
  if ((existingSale.sale_type || 'mostrador') !== saleType) {
    changes.push({ field: 'Tipo de Venta', oldVal: existingSale.sale_type || 'mostrador', newVal: saleType });
  }

  if (changes.length === 0) {
    redirect(`/sales/${saleId}?success=${encodeURIComponent('No se realizaron cambios en la información de la venta.')}`);
  }

  // 6. Actualizar únicamente campos administrativos permitidos
  const { error: updateErr } = await supabase
    .from('sales')
    .update({
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      notes: notes || null,
      internal_notes: internalNotes || null,
      sale_type: saleType
    })
    .eq('id', saleId)
    .eq('store_id', activeStore.id);

  if (updateErr) {
    redirect(`/sales/${saleId}?error=${encodeURIComponent(updateErr.message)}`);
  }

  // 7. Guardar registros de auditoría por cada campo modificado
  for (const c of changes) {
    await supabase.from('sale_audit_logs').insert({
      sale_id: saleId,
      store_id: activeStore.id,
      user_id: securityCtx.user.id,
      user_email: securityCtx.user.email,
      field_name: c.field,
      old_value: c.oldVal,
      new_value: c.newVal
    });
  }

  // 8. Log de seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'SALE_METADATA_UPDATED',
    entity: 'sales',
    entityId: saleId,
    metadata: {
      changes_count: changes.length,
      sale_number: existingSale.sale_number
    }
  });

  revalidatePath(`/sales/${saleId}`);
  revalidatePath('/sales/team-performance');

  redirect(`/sales/${saleId}?success=${encodeURIComponent('Información administrativa de la venta actualizada correctamente.')}`);
}
