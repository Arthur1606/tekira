'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) {
    redirect('/onboarding');
  }
  const activeStore = stores[0];

  // 2. Control de Acceso y Roles
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'CREATE_TRANSACTION');
  } catch (err: any) {
    redirect(`/transactions/new?error=${encodeURIComponent(err.message || 'Sin permisos para registrar transacciones.')}`);
  }

  // 3. Obtener id de vendedor y código de empleado de la tabla team_members si existe
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, employee_code')
    .eq('store_id', activeStore.id)
    .eq('user_id', securityCtx.user.id)
    .maybeSingle();

  const sellerId = teamMember?.id || null;
  const employeeCode = teamMember?.employee_code || 'TKR-EMP-000001';

  // 4. Extraer y sanitizar datos
  const type = (formData.get('type') as string || '').trim();
  const amountStr = formData.get('amount') as string;
  const category = (formData.get('category') as string || 'General').trim();
  const paymentMethod = (formData.get('payment_method') as string || 'efectivo').trim();
  const description = (formData.get('description') as string || '').trim();

  if (!['income', 'expense'].includes(type)) {
    redirect(`/transactions/new?error=${encodeURIComponent('Tipo de movimiento inválido.')}`);
  }

  const amount = amountStr ? parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) : 0;

  if (isNaN(amount) || amount <= 0) {
    redirect(`/transactions/new?error=${encodeURIComponent('El monto debe ser un valor positivo mayor a 0.')}`);
  }

  // Regla estricta para Empleados: Sólo pueden crear Ingresos (Ventas)
  if (securityCtx.role === 'employee' && type !== 'income') {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'transactions',
      metadata: { reason: 'Empleado intentó registrar un egreso' }
    });
    redirect(`/transactions/new?error=${encodeURIComponent('Los empleados únicamente pueden registrar ventas/ingresos.')}`);
  }

  // 5. Validar sesión activa de caja (debe estar status = 'open')
  const { data: activeSession } = await supabase
    .from('cash_openings')
    .select('id')
    .eq('store_id', activeStore.id)
    .eq('status', 'open')
    .maybeSingle();

  if (!activeSession) {
    redirect(`/transactions/new?error=${encodeURIComponent('No existe una caja abierta actualmente. Solicita apertura al administrador.')}`);
  }

  // 6. Vinculación opcional a producto (variante)
  const linkProduct = formData.get('link_product') === 'yes';
  const variantId = linkProduct ? (formData.get('variant_id') as string || '').trim() : null;
  const quantityStr = linkProduct ? formData.get('quantity') as string : '0';
  const quantity = parseFloat(quantityStr) || 0;

  let targetProductId: string | null = null;

  if (variantId) {
    const { data: variantCheck } = await supabase
      .from('product_variants')
      .select('id, product_id, product:products!inner(store_id)')
      .eq('id', variantId)
      .single();

    if (!variantCheck || (variantCheck.product as any)?.store_id !== activeStore.id) {
      await logSecurityEvent({
        storeId: activeStore.id,
        userId: securityCtx.user.id,
        action: 'UNAUTHORIZED_ACTION_ATTEMPT',
        entity: 'product_variants',
        metadata: { reason: 'Variante no pertenece al comercio en transacción', variantId }
      });
      redirect(`/transactions/new?error=${encodeURIComponent('La variante seleccionada no pertenece a tu comercio.')}`);
    }

    targetProductId = variantCheck.product_id || null;
  }

  // 7. Insertar Transacción en BD asociando user_id y employee_code
  const { data: newTx, error } = await supabase.from('transactions').insert({
    store_id: activeStore.id,
    type,
    amount,
    category,
    payment_method: paymentMethod,
    description: description || null,
    variant_id: variantId,
    quantity: variantId ? quantity : null,
    cash_session_id: activeSession.id,
    seller_id: sellerId,
    user_id: securityCtx.user.id,
    employee_code: employeeCode
  }).select().single();

  if (error) {
    redirect(`/transactions/new?error=${encodeURIComponent(error.message)}`);
  }

  // 8. Auto-sincronizar movimiento de inventario si se seleccionó variante
  if (variantId && quantity > 0) {
    const invType = type === 'income' ? 'sale' : 'entry';
    const reason = type === 'income' ? 'Venta (Automático)' : 'Compra (Automático)';

    const { error: invError } = await supabase.from('inventory_movements').insert({
      product_id: targetProductId,
      variant_id: variantId,
      type: invType,
      quantity,
      reason
    });

    if (invError) {
      console.error('[TRANSACTION INVENTORY SYNC ERROR]:', invError.message);
    }
  }

  // 9. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'TRANSACTION_CREATED',
    entity: 'transactions',
    entityId: newTx?.id || null,
    metadata: {
      type,
      amount,
      category,
      payment_method: paymentMethod,
      variant_id: variantId,
      product_id: targetProductId,
      quantity
    }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  redirect(`/dashboard?success=${encodeURIComponent('Movimiento guardado correctamente.')}`);
}

export async function openCashRegister(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Control de Acceso Estricto: Solo OWNER y ADMIN pueden abrir la caja
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'OPEN_CASH_REGISTER');
  } catch (err: any) {
    redirect(`/dashboard?error=${encodeURIComponent('No tienes permisos suficientes para abrir la caja.')}`);
  }

  // 3. Validar Backend: NO permitir abrir caja si ya existe una caja en status = 'open'
  const { data: existingOpen } = await supabase
    .from('cash_openings')
    .select('id')
    .eq('store_id', activeStore.id)
    .eq('status', 'open')
    .maybeSingle();

  if (existingOpen) {
    redirect(`/dashboard?error=${encodeURIComponent('Existe una caja abierta actualmente. Debes cerrarla antes de abrir una nueva.')}`);
  }

  // 4. Sanitizar monto de apertura
  const amountStr = formData.get('amount') as string;
  const amount = amountStr ? parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) : 0;

  if (isNaN(amount) || amount < 0) {
    redirect(`/dashboard?error=${encodeURIComponent('El monto de apertura debe ser mayor o igual a 0.')}`);
  }

  // 5. Insertar apertura de caja
  const { data: newSession, error } = await supabase.from('cash_openings').insert({
    store_id: activeStore.id,
    amount,
    created_by: securityCtx.user.id,
    status: 'open'
  }).select().single();

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  // 6. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'CASH_REGISTER_OPENED',
    entity: 'cash_openings',
    entityId: newSession?.id || null,
    metadata: {
      initial_amount: amount,
      opened_by_role: securityCtx.role
    }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  redirect(`/dashboard?success=${encodeURIComponent('Caja abierta correctamente.')}`);
}

export async function closeCashRegister(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Control de Acceso Estricto: Solo OWNER y ADMIN pueden cerrar la caja
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'CLOSE_CASH_REGISTER');
  } catch (err: any) {
    redirect(`/dashboard?error=${encodeURIComponent('No tienes permisos para cerrar caja.')}`);
  }

  // 3. Extraer y sanitizar datos
  const openingId = (formData.get('opening_id') as string || '').trim();
  const countedAmountStr = formData.get('counted_amount') as string;
  const expectedAmountStr = formData.get('expected_amount') as string;

  const countedAmount = countedAmountStr ? parseFloat(countedAmountStr.replace(/[^0-9.-]+/g, '')) : 0;
  const expectedAmount = expectedAmountStr ? parseFloat(expectedAmountStr.replace(/[^0-9.-]+/g, '')) : 0;

  if (!openingId || isNaN(countedAmount) || countedAmount < 0) {
    redirect(`/dashboard?error=${encodeURIComponent('El monto contado en caja debe ser un número válido >= 0.')}`);
  }

  // 4. Pre-validar si ya existe un registro de cierre en cash_closings para este opening_id
  const { data: existingClosing } = await supabase
    .from('cash_closings')
    .select('id')
    .eq('opening_id', openingId)
    .maybeSingle();

  if (existingClosing) {
    // Si ya existe el registro de cierre, asegurar que status en cash_openings esté actualizado a 'closed'
    await supabase
      .from('cash_openings')
      .update({ status: 'closed' })
      .eq('id', openingId)
      .eq('store_id', activeStore.id);

    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    redirect(`/dashboard?error=${encodeURIComponent('La caja ya fue cerrada anteriormente.')}`);
  }

  // 5. Validar estado de la apertura
  const { data: sessionCheck } = await supabase
    .from('cash_openings')
    .select('id, status')
    .eq('id', openingId)
    .eq('store_id', activeStore.id)
    .maybeSingle();

  if (!sessionCheck || sessionCheck.status !== 'open') {
    redirect(`/dashboard?error=${encodeURIComponent('La caja ya fue cerrada anteriormente.')}`);
  }

  const difference = countedAmount - expectedAmount;

  // 6. Registrar el cierre en cash_closings capturando errores de Unique Constraint (23505)
  const { data: closing, error: closingError } = await supabase
    .from('cash_closings')
    .insert({
      opening_id: openingId,
      expected_amount: expectedAmount,
      counted_amount: countedAmount,
      difference,
      closed_by: securityCtx.user.id
    })
    .select()
    .single();

  if (closingError) {
    console.error('[CLOSE CASH ERROR]:', closingError);
    if (closingError.code === '23505') {
      await supabase
        .from('cash_openings')
        .update({ status: 'closed' })
        .eq('id', openingId)
        .eq('store_id', activeStore.id);

      revalidatePath('/', 'layout');
      revalidatePath('/dashboard');
      redirect(`/dashboard?error=${encodeURIComponent('La caja ya fue cerrada anteriormente.')}`);
    }
    redirect(`/dashboard?error=${encodeURIComponent('Error al guardar el cierre de caja. Inténtalo de nuevo.')}`);
  }

  // 7. Cambiar estado de la caja activa: open -> closed
  const { error: updateError } = await supabase
    .from('cash_openings')
    .update({ status: 'closed' })
    .eq('id', openingId)
    .eq('store_id', activeStore.id);

  if (updateError) {
    console.error('[UPDATE CASH SESSION ERROR]:', updateError);
  }

  // 8. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'CASH_CLOSED',
    entity: 'cash_closings',
    entityId: closing?.id || null,
    metadata: {
      opening_id: openingId,
      expected_amount: expectedAmount,
      counted_amount: countedAmount,
      difference,
      closed_by_role: securityCtx.role
    }
  });

  const diffText = difference === 0 
    ? 'Sin diferencias' 
    : (difference > 0 ? `Sobrante: +$${difference.toLocaleString('es-CO')}` : `Faltante: -$${Math.abs(difference).toLocaleString('es-CO')}`);

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  redirect(`/dashboard?success=${encodeURIComponent(`Caja cerrada correctamente. ${diffText}`)}`);
}

export async function createMultiItemSale(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Permisos
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'CREATE_TRANSACTION');
  } catch (err: any) {
    redirect(`/transactions/new?error=${encodeURIComponent(err.message || 'Sin permisos para registrar ventas.')}`);
  }

  // 3. Vendedor y código de empleado
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, employee_code')
    .eq('store_id', activeStore.id)
    .eq('user_id', securityCtx.user.id)
    .maybeSingle();

  const sellerId = teamMember?.id || null;
  const employeeCode = teamMember?.employee_code || 'TKR-EMP-000001';

  // 4. Validar sesión de caja abierta
  const { data: activeSession } = await supabase
    .from('cash_openings')
    .select('id')
    .eq('store_id', activeStore.id)
    .eq('status', 'open')
    .maybeSingle();

  if (!activeSession) {
    redirect(`/transactions/new?error=${encodeURIComponent('No existe una caja abierta actualmente. Solicita apertura al administrador.')}`);
  }

  // 5. Parsear Carrito Multiproducto (JSON string en campo `items_json`)
  const itemsJson = formData.get('items_json') as string || '[]';
  const paymentMethod = (formData.get('payment_method') as string || 'efectivo').trim();
  const customerId = (formData.get('customer_id') as string || '').trim() || null;
  const initialStatus = (formData.get('status') as string || 'entregado').trim();

  let items: Array<{ productId: string; variantId?: string; quantity: number; unitPrice: number }> = [];
  try {
    items = JSON.parse(itemsJson);
  } catch (e) {
    redirect(`/transactions/new?error=${encodeURIComponent('El contenido del carrito no es válido.')}`);
  }

  if (!items || items.length === 0) {
    redirect(`/transactions/new?error=${encodeURIComponent('Selecciona al menos un producto para registrar la venta.')}`);
  }

  // 6. Calcular Total
  let totalAmount = 0;
  const processedItems = items.map(item => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    const subtotal = qty * price;
    totalAmount += subtotal;
    return { ...item, quantity: qty, unitPrice: price, subtotal };
  });

  // 6.1 Validar inventario disponible antes de confirmar la venta
  for (const item of processedItems) {
    const { data: prod } = await supabase
      .from('products')
      .select('id, name, current_stock, quantity')
      .eq('id', item.productId)
      .single();

    const availableStock = prod ? (Number(prod.current_stock !== null && prod.current_stock !== undefined ? prod.current_stock : prod.quantity) || 0) : 0;
    if (availableStock < item.quantity) {
      redirect(`/transactions/new?error=${encodeURIComponent(`No hay suficiente inventario disponible para "${prod?.name || 'el producto'}". Disponible: ${availableStock}, Solicitado: ${item.quantity}.`)}`);
    }
  }

  // 7. Generar número de venta consecutivo (#000145)
  const { count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', activeStore.id);

  const saleSeq = ((count || 0) + 1).toString().padStart(6, '0');
  const saleNumber = `Venta #${saleSeq}`;

  // 8. Insertar 1 Registro en sales con estado inicial 'pendiente'
  const { data: newSale, error: saleErr } = await supabase
    .from('sales')
    .insert({
      store_id: activeStore.id,
      user_id: securityCtx.user.id,
      employee_code: employeeCode,
      customer_id: customerId,
      sale_number: saleNumber,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      cash_session_id: activeSession.id,
      status: initialStatus
    })
    .select()
    .single();

  if (saleErr || !newSale) {
    redirect(`/transactions/new?error=${encodeURIComponent(saleErr?.message || 'Error al guardar la venta.')}`);
  }

  // 9. Insertar N Registros en sale_items y Descontar Inventario de forma precisa
  for (const item of processedItems) {
    await supabase.from('sale_items').insert({
      sale_id: newSale.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal
    });

    // Actualizar inventario exactamente descontando la cantidad vendida
    const { data: prod } = await supabase
      .from('products')
      .select('quantity, current_stock, min_stock')
      .eq('id', item.productId)
      .single();

    if (prod) {
      const oldStock = Number(prod.current_stock !== null && prod.current_stock !== undefined ? prod.current_stock : prod.quantity) || 0;
      const newStock = Math.max(0, oldStock - item.quantity);
      const minStockVal = Number(prod.min_stock || 5);
      const newStatus = newStock === 0 ? 'out_of_stock' : (newStock <= minStockVal ? 'low_stock' : 'available');

      await supabase
        .from('products')
        .update({
          current_stock: newStock,
          quantity: newStock,
          status: newStatus
        })
        .eq('id', item.productId);
    }
  }

  // 10. Registrar 1 Transacción comercial asociada a la venta
  await supabase.from('transactions').insert({
    store_id: activeStore.id,
    type: 'income',
    amount: totalAmount,
    category: 'Ventas',
    payment_method: paymentMethod,
    description: `Venta ${saleNumber} (${processedItems.length} artículos)`,
    cash_session_id: activeSession.id,
    seller_id: sellerId,
    user_id: securityCtx.user.id,
    employee_code: employeeCode
  });

  // 11. Auditoría
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'MULTI_ITEM_SALE_CREATED',
    entity: 'sales',
    entityId: newSale.id,
    metadata: {
      sale_number: saleNumber,
      total_amount: totalAmount,
      item_count: processedItems.length,
      employee_code: employeeCode
    }
  });

  revalidatePath('/inventory');
  revalidatePath('/dashboard');
  revalidatePath('/transactions/new');

  redirect(`/transactions/new?success=${encodeURIComponent(`Venta ${saleNumber} realizada correctamente ($${totalAmount.toLocaleString('es-CO')}).`)}`);
}
