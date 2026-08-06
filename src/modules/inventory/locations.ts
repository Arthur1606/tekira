'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';
import { checkStoreLimits } from '@/modules/subscriptions/services';

export interface InventoryLocation {
  id: string;
  store_id: string;
  name: string;
  type: 'store' | 'warehouse' | 'other';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface LocationStock {
  id: string;
  store_id: string;
  location_id: string;
  variant_id: string;
  quantity: number;
}

export async function getLocations(storeId: string): Promise<InventoryLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_locations')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  return data || [];
}

export async function createLocationAction(formData: FormData) {
  const supabase = await createClient();
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'CREATE_LOCATION');

  const name = (formData.get('name') as string || '').trim();
  const type = (formData.get('type') as string || 'warehouse') as 'store' | 'warehouse' | 'other';

  if (!name) {
    redirect(`/inventory?error=${encodeURIComponent('El nombre de la ubicación es obligatorio.')}`);
  }

  // Validación de límites del plan SaaS activo
  const limits = await checkStoreLimits(activeStore.id);
  if (!limits.canAddLocation) {
    redirect(`/inventory?error=${encodeURIComponent(`Has alcanzado el límite de ubicaciones/bodegas (${limits.usage.locations.max}) de tu plan SaaS (${limits.subscription.plan_tier}). Contáctate con soporte para realizar un upgrade.`)}`);
  }

  const { data: newLoc, error } = await supabase
    .from('inventory_locations')
    .insert({
      store_id: activeStore.id,
      name,
      type,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
  }

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'LOCATION_CREATED',
    entity: 'inventory_locations',
    entityId: newLoc.id,
    metadata: { location_name: name, type }
  });

  revalidatePath('/inventory');
  redirect(`/inventory?success=${encodeURIComponent(`Ubicación "${name}" creada exitosamente.`)}`);
}

export async function transferStockAction(formData: FormData) {
  const supabase = await createClient();
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'TRANSFER_STOCK');

  const fromLocationId = (formData.get('from_location_id') as string || '').trim();
  const toLocationId = (formData.get('to_location_id') as string || '').trim();
  const variantId = (formData.get('variant_id') as string || '').trim();
  const quantity = parseInt(formData.get('quantity') as string || '0', 10);
  const notes = (formData.get('notes') as string || '').trim();

  if (!fromLocationId || !toLocationId || !variantId || quantity <= 0) {
    redirect(`/inventory?error=${encodeURIComponent('Datos de transferencia inválidos.')}`);
  }

  if (fromLocationId === toLocationId) {
    redirect(`/inventory?error=${encodeURIComponent('La ubicación de origen y destino deben ser distintas.')}`);
  }

  const { data: fromStock } = await supabase
    .from('inventory_location_stock')
    .select('*')
    .eq('location_id', fromLocationId)
    .eq('variant_id', variantId)
    .maybeSingle();

  const currentFromQty = fromStock ? fromStock.quantity : 0;
  if (currentFromQty < quantity) {
    redirect(`/inventory?error=${encodeURIComponent(`Stock insuficiente en ubicación de origen. Disponibles: ${currentFromQty} unidades.`)}`);
  }

  const { error: decErr } = await supabase
    .from('inventory_location_stock')
    .upsert({
      store_id: activeStore.id,
      location_id: fromLocationId,
      variant_id: variantId,
      quantity: currentFromQty - quantity
    }, { onConflict: 'location_id,variant_id' });

  if (decErr) {
    redirect(`/inventory?error=${encodeURIComponent(decErr.message)}`);
  }

  const { data: toStock } = await supabase
    .from('inventory_location_stock')
    .select('*')
    .eq('location_id', toLocationId)
    .eq('variant_id', variantId)
    .maybeSingle();

  const currentToQty = toStock ? toStock.quantity : 0;

  const { error: incErr } = await supabase
    .from('inventory_location_stock')
    .upsert({
      store_id: activeStore.id,
      location_id: toLocationId,
      variant_id: variantId,
      quantity: currentToQty + quantity
    }, { onConflict: 'location_id,variant_id' });

  if (incErr) {
    redirect(`/inventory?error=${encodeURIComponent(incErr.message)}`);
  }

  await supabase.from('inventory_transfers').insert({
    store_id: activeStore.id,
    from_location_id: fromLocationId,
    to_location_id: toLocationId,
    variant_id: variantId,
    quantity,
    notes: notes || null,
    created_by: securityCtx.user.id
  });

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'STOCK_TRANSFERRED',
    entity: 'inventory_transfers',
    metadata: {
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      variant_id: variantId,
      quantity
    }
  });

  revalidatePath('/inventory');
  redirect(`/inventory?success=${encodeURIComponent(`Transferencia de ${quantity} unidades completada exitosamente.`)}`);
}
