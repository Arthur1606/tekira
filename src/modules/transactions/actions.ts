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
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent(err.message || 'Sin permisos para registrar transacciones.')}`);
  }

  // 3. Obtener id de vendedor de la tabla team_members si existe
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('store_id', activeStore.id)
    .eq('user_id', securityCtx.user.id)
    .single();

  const sellerId = teamMember?.id || null;

  // 4. Extraer y sanitizar datos
  const type = (formData.get('type') as string || '').trim();
  const amountStr = formData.get('amount') as string;
  const category = (formData.get('category') as string || 'General').trim();
  const paymentMethod = (formData.get('payment_method') as string || 'efectivo').trim();
  const description = (formData.get('description') as string || '').trim();

  if (!['income', 'expense'].includes(type)) {
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent('Tipo de movimiento inválido.')}`);
  }

  const amount = amountStr ? parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) : 0;

  if (isNaN(amount) || amount <= 0) {
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent('El monto debe ser un valor positivo mayor a 0.')}`);
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
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent('Los empleados únicamente pueden registrar ventas/ingresos.')}`);
  }

  // 5. Validar sesión activa de caja (debe estar status = 'open')
  const { data: activeSession } = await supabase
    .from('cash_openings')
    .select('id')
    .eq('store_id', activeStore.id)
    .eq('status', 'open')
    .maybeSingle();

  if (!activeSession) {
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent('No existe una caja abierta actualmente. Solicita apertura al administrador.')}`);
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
      redirect(`/dashboard/transactions/new?error=${encodeURIComponent('La variante seleccionada no pertenece a tu comercio.')}`);
    }

    targetProductId = variantCheck.product_id || null;
  }

  // 7. Insertar Transacción en BD
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
    seller_id: sellerId
  }).select().single();

  if (error) {
    redirect(`/dashboard/transactions/new?error=${encodeURIComponent(error.message)}`);
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
