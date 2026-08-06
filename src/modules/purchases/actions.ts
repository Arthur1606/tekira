'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserStores } from '@/modules/stores/services';
import { getActiveCashSession } from '@/modules/transactions/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function createSupplier(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) {
    throw new Error('No se encontró un comercio activo');
  }
  const storeId = stores[0].id;

  // 2. Control de Acceso y Roles (Solo Owner y Admin pueden registrar proveedores)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(storeId, ['owner', 'admin'], 'CREATE_SUPPLIER');
  } catch (err: any) {
    redirect(`/dashboard/suppliers?error=${encodeURIComponent(err.message || 'Sin permisos para crear proveedores.')}`);
  }

  // 3. Extraer y sanitizar datos
  const name = (formData.get('name') as string || '').trim();
  const phone = (formData.get('phone') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const address = (formData.get('address') as string || '').trim();
  const category = (formData.get('category') as string || '').trim();

  if (!name) {
    redirect('/dashboard/suppliers/new?error=El nombre del proveedor es obligatorio');
  }

  // 4. Insertar Proveedor
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert({
      store_id: storeId,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      category: category || null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier:', error);
    redirect('/dashboard/suppliers?error=Error al crear el proveedor');
  }

  // 5. Registro de Auditoría
  await logSecurityEvent({
    storeId,
    userId: securityCtx.user.id,
    action: 'SUPPLIER_CREATED',
    entity: 'suppliers',
    entityId: supplier?.id || null,
    metadata: {
      name,
      category,
      email
    }
  });

  revalidatePath('/dashboard/suppliers');
  revalidatePath('/dashboard/purchases/new');
  redirect('/dashboard/suppliers?success=Proveedor creado con éxito');
}

export interface PurchaseItemData {
  variant_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export async function createPurchase(
  supplierId: string, 
  paymentMethod: string, 
  items: PurchaseItemData[], 
  totalAmount: number
) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) {
    return { error: 'No se encontró un comercio activo' };
  }
  const storeId = stores[0].id;

  // 2. Control de Acceso y Roles (Solo Owner y Admin pueden realizar compras masivas)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(storeId, ['owner', 'admin'], 'CREATE_PURCHASE');
  } catch (err: any) {
    return { error: err.message || 'Sin permisos para registrar compras.' };
  }

  // 3. Validar sesión de caja activa
  const activeSession = await getActiveCashSession(storeId);
  if (!activeSession) {
    return { error: 'Debes tener una sesión de caja abierta para registrar una compra' };
  }

  // 4. Validar insumos de la compra
  if (!supplierId || !items || items.length === 0) {
    return { error: 'Faltan datos obligatorios de la compra o productos' };
  }

  // Verificar que el proveedor pertenezca al comercio
  const { data: supplierCheck } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('store_id', storeId)
    .single();

  if (!supplierCheck) {
    await logSecurityEvent({
      storeId,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'suppliers',
      metadata: { reason: 'Intento de compra a proveedor no perteneciente al comercio', supplierId }
    });
    return { error: 'El proveedor seleccionado no pertenece a tu comercio.' };
  }

  // Sanitizar y recalcular el total de los ítems en el servidor (nunca confiar solo en el cliente)
  let calculatedTotal = 0;
  const sanitizedItems: PurchaseItemData[] = [];

  for (const item of items) {
    const qty = Math.max(0.0001, Number(item.quantity) || 0);
    const cost = Math.max(0, Number(item.unit_cost) || 0);
    const itemSubtotal = qty * cost;

    if (!item.variant_id || qty <= 0 || cost < 0) {
      return { error: 'Verifica que todos los ítems tengan cantidad y costos válidos.' };
    }

    sanitizedItems.push({
      variant_id: item.variant_id,
      quantity: qty,
      unit_cost: cost,
      subtotal: itemSubtotal
    });

    calculatedTotal += itemSubtotal;
  }

  if (calculatedTotal <= 0) {
    return { error: 'El total de la compra debe ser un valor positivo.' };
  }

  // 5. Crear compra base
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      store_id: storeId,
      supplier_id: supplierId,
      total_amount: calculatedTotal,
      payment_method: paymentMethod || 'efectivo',
      status: 'completed',
      created_by: securityCtx.user.id
    })
    .select()
    .single();

  if (purchaseError || !purchase) {
    console.error('Error creating purchase:', purchaseError);
    return { error: 'Error al registrar la compra base' };
  }

  // 6. Crear detalles de compra
  const purchaseItemsToInsert = sanitizedItems.map(item => ({
    purchase_id: purchase.id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    subtotal: item.subtotal
  }));

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(purchaseItemsToInsert);

  if (itemsError) {
    console.error('Error creating purchase items:', itemsError);
    return { error: 'Error al registrar los productos de la compra' };
  }

  // 7. Crear movimientos de inventario (el trigger SQL actualizará el stock)
  const variantIds = sanitizedItems.map(i => i.variant_id);
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .in('id', variantIds);
    
  const variantMap = new Map(variants?.map(v => [v.id, v.product_id]) || []);

  const inventoryMovements = sanitizedItems.map(item => ({
    product_id: variantMap.get(item.variant_id) || item.variant_id,
    variant_id: item.variant_id,
    type: 'entry',
    quantity: item.quantity,
    reason: 'purchase',
    purchase_id: purchase.id
  }));

  const { error: inventoryError } = await supabase
    .from('inventory_movements')
    .insert(inventoryMovements);

  if (inventoryError) {
    console.error('Error creating inventory movements:', inventoryError);
    return { error: 'Error al actualizar el inventario' };
  }

  // 8. Crear movimiento financiero en caja (Expense)
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      store_id: storeId,
      type: 'expense',
      amount: calculatedTotal,
      category: 'Compra',
      payment_method: paymentMethod || 'efectivo',
      description: 'Pago de compra de mercancía a proveedor',
      purchase_id: purchase.id,
      supplier_id: supplierId,
      cash_session_id: activeSession.id
    });

  if (txError) {
    console.error('Error creating financial transaction:', txError);
    return { error: 'Error al registrar el movimiento en caja' };
  }

  // 9. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId,
    userId: securityCtx.user.id,
    action: 'PURCHASE_CREATED',
    entity: 'purchases',
    entityId: purchase.id,
    metadata: {
      supplier_id: supplierId,
      total_amount: calculatedTotal,
      items_count: sanitizedItems.length,
      payment_method: paymentMethod
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/transactions');
  revalidatePath('/dashboard/purchases');

  return { success: true, purchaseId: purchase.id };
}
