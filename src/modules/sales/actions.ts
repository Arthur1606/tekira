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

export async function deleteSale(formData: FormData) {
  const supabase = await createClient();

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const saleId = (formData.get('sale_id') as string || '').trim();
  if (!saleId) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Identificador de venta no válido.')}`);
  }

  // Permiso Exclusivo para OWNER
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner'], 'DELETE_SALE');
  } catch (err: any) {
    redirect(`/sales/${saleId}?error=${encodeURIComponent('Permisos insuficientes. Únicamente el propietario (owner) del comercio puede eliminar operaciones comerciales.')}`);
  }

  // 1. Obtener detalles de la venta e ítems vendidos
  const { data: sale } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .eq('store_id', activeStore.id)
    .single();

  if (!sale) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Venta no encontrada.')}`);
  }

  // 2. Devolver stock de cada producto vendido
  if (sale.sale_items && Array.isArray(sale.sale_items)) {
    for (const item of sale.sale_items) {
      const { data: prod } = await supabase
        .from('products')
        .select('current_stock, quantity')
        .eq('id', item.product_id)
        .single();

      if (prod) {
        const oldStock = Number(prod.current_stock ?? prod.quantity) || 0;
        const restoredStock = oldStock + Number(item.quantity);
        await supabase
          .from('products')
          .update({ current_stock: restoredStock, quantity: restoredStock, status: 'available' })
          .eq('id', item.product_id);

        // Registrar devolución en trazabilidad de inventario
        await supabase.from('inventory_movements').insert({
          store_id: activeStore.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          user_id: securityCtx.user.id,
          type: 'RETURN',
          quantity: Number(item.quantity),
          previous_stock: oldStock,
          new_stock: restoredStock,
          reason: `Devolución por eliminación de ${sale.sale_number || 'venta'}`,
          reference_id: saleId
        });
      }
    }
  }

  // 3. Eliminar transacción de caja vinculada
  if (sale.sale_number) {
    await supabase
      .from('transactions')
      .delete()
      .eq('store_id', activeStore.id)
      .ilike('description', `%${sale.sale_number}%`);
  }

  // 4. Eliminar venta principal (sale_items se eliminan en cascada)
  const { error: delErr } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)
    .eq('store_id', activeStore.id);

  if (delErr) {
    redirect(`/sales/${saleId}?error=${encodeURIComponent(delErr.message)}`);
  }

  // 5. Auditoría
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'SALE_DELETED_AND_STOCK_RESTORED',
    entity: 'sales',
    entityId: saleId,
    metadata: {
      sale_number: sale.sale_number,
      total_amount: sale.total_amount
    }
  });

  revalidatePath('/sales/team-performance');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');

  redirect(`/sales/team-performance?success=${encodeURIComponent(`Venta ${sale.sale_number || ''} eliminada y stock de inventario devuelto correctamente.`)}`);
}

export async function updateSaleStatus(formData: FormData) {
  const supabase = await createClient();

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const saleId = (formData.get('sale_id') as string || '').trim();
  const newStatus = (formData.get('status') as string || 'pendiente').trim();

  if (!saleId) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Identificador de venta no válido.')}`);
  }

  // Permitir a owner, admin y employee actualizar estado de entrega de venta
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'UPDATE_SALE_STATUS');
  } catch (err: any) {
    redirect(`/sales/${saleId}?error=${encodeURIComponent('Sin permisos para actualizar estado de la venta.')}`);
  }

  const { data: existingSale } = await supabase
    .from('sales')
    .select('id, sale_number, status')
    .eq('id', saleId)
    .eq('store_id', activeStore.id)
    .single();

  if (!existingSale) {
    redirect(`/sales/team-performance?error=${encodeURIComponent('Venta no encontrada.')}`);
  }

  const oldStatus = existingSale.status || 'pendiente';
  if (oldStatus === newStatus) {
    redirect(`/sales/${saleId}?success=${encodeURIComponent('El estado de la venta no ha cambiado.')}`);
  }

  // Actualizar únicamente el estado de la venta (valores financieros e inventario inmutables)
  await supabase
    .from('sales')
    .update({ status: newStatus })
    .eq('id', saleId)
    .eq('store_id', activeStore.id);

  // Guardar log en auditoría
  await supabase.from('sale_audit_logs').insert({
    sale_id: saleId,
    store_id: activeStore.id,
    user_id: securityCtx.user.id,
    user_email: securityCtx.user.email,
    field_name: 'Estado de Operación',
    old_value: oldStatus === 'entregado' ? 'Entregado 🟢' : 'Pendiente 🟡',
    new_value: newStatus === 'entregado' ? 'Entregado 🟢' : 'Pendiente 🟡'
  });

  revalidatePath(`/sales/${saleId}`);
  revalidatePath('/sales/team-performance');

  redirect(`/sales/${saleId}?success=${encodeURIComponent(`Estado de ${existingSale.sale_number || 'la venta'} cambiado a "${newStatus === 'entregado' ? 'Entregado 🟢' : 'Pendiente 🟡'}".`)}`);
}

export async function recalculateStoreInventoryAction() {
  const supabase = await createClient();

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'RECALCULATE_INVENTORY');
  } catch (err: any) {
    redirect(`/inventory?error=${encodeURIComponent('Permisos insuficientes para recalcular el inventario.')}`);
  }

  // Ejecutar función RPC en base de datos para recalcular inventario real
  const { error: rpcErr } = await supabase.rpc('recalculate_store_inventory', { p_store_id: activeStore.id });

  if (rpcErr) {
    redirect(`/inventory?error=${encodeURIComponent(rpcErr.message)}`);
  }

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'STORE_INVENTORY_RECALCULATED',
    entity: 'products',
    entityId: activeStore.id
  });

  revalidatePath('/inventory');
  revalidatePath('/dashboard');

  redirect(`/inventory?success=${encodeURIComponent('Inventario recalculado e igualado correctamente con los movimientos de trazabilidad.')}`);
}
