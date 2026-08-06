'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Control de Acceso y Roles (Solo Owner y Admin pueden crear productos)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'CREATE_PRODUCT');
  } catch (err: any) {
    redirect(`/dashboard/inventory/new?error=${encodeURIComponent(err.message || 'Sin permisos para crear productos.')}`);
  }

  // 3. Extraer y sanitizar datos de entrada
  const name = (formData.get('name') as string || '').trim();
  const category = (formData.get('category') as string || '').trim();
  const unit = (formData.get('unit') as string || 'unidad').trim();
  
  const quantityRaw = formData.get('quantity') as string;
  const minStockRaw = formData.get('min_stock') as string;
  const costStr = formData.get('cost') as string;
  const salePriceStr = formData.get('sale_price') as string;

  const quantity = Math.max(0, parseFloat(quantityRaw) || 0);
  const minStock = Math.max(0, parseFloat(minStockRaw) || 0);
  const cost = Math.max(0, costStr ? parseFloat(costStr.replace(/[^0-9.-]+/g, '')) : 0);
  const salePrice = Math.max(0, salePriceStr ? parseFloat(salePriceStr.replace(/[^0-9.-]+/g, '')) : 0);

  if (!name || isNaN(quantity) || isNaN(minStock) || isNaN(cost) || isNaN(salePrice)) {
    redirect(`/dashboard/inventory/new?error=${encodeURIComponent('Por favor, revisa todos los campos obligatorios.')}`);
  }

  // Generación automática de SKU sanitizado si no se provee
  let finalSku = (formData.get('sku') as string || '').trim().toUpperCase();
  if (!finalSku) {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'PRO';
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', activeStore.id)
      .like('sku', `${prefix}-%`);
      
    const nextNumber = (count || 0) + 1;
    finalSku = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // 4. Insertar Producto (Inicialmente quantity 0)
  const { data: newProduct, error } = await supabase.from('products').insert({
    store_id: activeStore.id,
    name,
    category,
    sku: finalSku,
    quantity: 0,
    unit,
    min_stock: minStock,
    status: 'out_of_stock'
  }).select().single();

  if (error || !newProduct) {
    redirect(`/dashboard/inventory/new?error=${encodeURIComponent(error?.message || 'Error al crear el producto')}`);
  }

  // 5. Insertar Variante Inicial por defecto
  const { data: newVariant, error: varError } = await supabase.from('product_variants').insert({
    product_id: newProduct.id,
    name: 'Variante Principal',
    sku: finalSku,
    quantity: 0,
    cost,
    sale_price: salePrice
  }).select().single();

  if (varError || !newVariant) {
    redirect(`/dashboard/inventory/new?error=${encodeURIComponent(varError?.message || 'Error al crear la variante principal')}`);
  }

  // 6. Si la cantidad inicial es > 0, registrar el primer movimiento de entrada con product_id y variant_id
  if (quantity > 0) {
    await supabase.from('inventory_movements').insert({
      product_id: newProduct.id,
      variant_id: newVariant.id,
      type: 'entry',
      quantity: quantity,
      reason: 'Inventario inicial'
    });
  }

  // 7. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'PRODUCT_CREATED',
    entity: 'products',
    entityId: newProduct.id,
    metadata: {
      product_name: name,
      sku: finalSku,
      category,
      initial_quantity: quantity,
      cost,
      sale_price: salePrice
    }
  });

  revalidatePath('/inventory');
  redirect(`/inventory?success=${encodeURIComponent('Producto creado correctamente.')}`);
}

export async function addMovement(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const productId = (formData.get('product_id') as string || '').trim();

  // 2. Verificar rol (Owner, Admin y Employee autorizados para movimientos operativos)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'ADD_INVENTORY_MOVEMENT');
  } catch (err: any) {
    redirect(`/inventory/${productId || ''}/movement?error=${encodeURIComponent(err.message || 'Sin permisos para registrar movimientos.')}`);
  }

  // 3. Extraer modo de operación (manual vs adjustment)
  const mode = (formData.get('mode') as string || 'manual').trim();
  const variantId = (formData.get('variant_id') as string || '').trim();

  if (!variantId) {
    redirect(`/inventory/${productId}/movement?error=${encodeURIComponent('Debe seleccionar una variante.')}`);
  }

  // 4. Validar que la variante pertenezca al comercio activo y obtener product_id asociado
  const { data: variant } = await supabase
    .from('product_variants')
    .select('id, product_id, name, quantity, product:products!inner(id, store_id)')
    .eq('id', variantId)
    .single();

  if (!variant || (variant.product as any)?.store_id !== activeStore.id) {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'product_variants',
      metadata: { reason: 'Intento de modificar variante de otro comercio', variantId }
    });
    redirect(`/inventory/${productId}/movement?error=${encodeURIComponent('La variante seleccionada no pertenece a tu comercio.')}`);
  }

  const targetProductId = variant.product_id || (variant.product as any)?.id || productId;

  let finalType = 'entry';
  let finalQuantity = 0;
  let finalReason = 'Movimiento manual';

  if (mode === 'adjustment') {
    // MODO: Ajuste de Inventario Físico (Solo Owner y Admin pueden realizar ajustes de inventario físico)
    if (securityCtx.role === 'employee') {
      await logSecurityEvent({
        storeId: activeStore.id,
        userId: securityCtx.user.id,
        action: 'UNAUTHORIZED_ACTION_ATTEMPT',
        entity: 'inventory_movements',
        metadata: { reason: 'Empleado intentó realizar ajuste de inventario físico' }
      });
      redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent('Los empleados no pueden realizar ajustes de inventario físico.')}`);
    }

    const physicalCountRaw = formData.get('physical_count') as string;
    const physicalCount = parseFloat(physicalCountRaw);

    if (isNaN(physicalCount) || physicalCount < 0) {
      redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent('El conteo físico real debe ser un número válido >= 0.')}`);
    }

    const currentQty = Number(variant.quantity) || 0;
    const diff = physicalCount - currentQty;

    if (diff === 0) {
      redirect(`/inventory/${targetProductId}/movement?success=${encodeURIComponent('El conteo físico coincide con el sistema. No se generaron cambios.')}`);
    } else if (diff > 0) {
      finalType = 'entry';
      finalQuantity = diff;
      finalReason = `Ajuste de inventario físico (Sobrante +${diff})`;
    } else {
      finalType = 'loss';
      finalQuantity = Math.abs(diff);
      finalReason = `Ajuste de inventario físico (Faltante -${Math.abs(diff)})`;
    }
  } else {
    // MODO: Registro Manual (Entrada, Merma, Daño, Descontinuado)
    const type = (formData.get('type') as string || '').trim();
    const quantity = parseFloat(formData.get('quantity') as string);
    const reason = (formData.get('reason') as string || 'Movimiento manual').trim();

    if (type === 'sale') {
      redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent('Las ventas no están permitidas desde el módulo de inventario. Regístralas desde Caja/Transacciones.')}`);
    }

    const validTypes = ['entry', 'exit', 'damage', 'loss', 'discontinued'];
    if (!validTypes.includes(type)) {
      redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent('Tipo de movimiento no válido.')}`);
    }

    if (isNaN(quantity) || quantity <= 0) {
      redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent('La cantidad debe ser un número positivo mayor a 0.')}`);
    }

    finalType = type;
    finalQuantity = quantity;
    finalReason = reason;
  }

  // 5. Insertar movimiento pasando AMBOS: product_id y variant_id
  const { data: newMov, error } = await supabase
    .from('inventory_movements')
    .insert({
      product_id: targetProductId,
      variant_id: variantId,
      type: finalType,
      quantity: finalQuantity,
      reason: finalReason
    })
    .select()
    .single();

  if (error) {
    console.error('[INVENTORY MOVEMENT ERROR]:', error);
    redirect(`/inventory/${targetProductId}/movement?error=${encodeURIComponent(error.message)}`);
  }

  // 6. Registro de Auditoría de Seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'INVENTORY_MOVEMENT_ADDED',
    entity: 'inventory_movements',
    entityId: newMov?.id || null,
    metadata: {
      product_id: targetProductId,
      variant_id: variantId,
      type: finalType,
      quantity: finalQuantity,
      reason: finalReason,
      mode
    }
  });

  revalidatePath('/inventory');
  revalidatePath(`/inventory/${targetProductId}/movement`);
  redirect(`/inventory/${targetProductId}/movement?success=${encodeURIComponent('Movimiento registrado correctamente.')}`);
}
