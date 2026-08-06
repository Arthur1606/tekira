'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function createStore(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Obtener el perfil del usuario para saber su nombre
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
  const userName = profile?.name || 'Propietario';

  // 2. Extraer datos del formulario
  const name = (formData.get('name') as string || '').trim();
  const category = (formData.get('category') as string || 'General').trim();
  const city = (formData.get('city') as string || '').trim();

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent('El nombre comercial es obligatorio.')}`);
  }

  // 3. Insertar tienda con valores por defecto multiempresa
  const { data: newStore, error } = await supabase.from('stores').insert({
    name,
    category,
    city,
    owner_id: user.id,
    status: 'active',
    currency: 'COP',
    timezone: 'America/Bogota'
  }).select().single();

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  // 4. Agregar automáticamente al creador como 'owner' en team_members
  if (newStore) {
    const { error: teamError } = await supabase.from('team_members').insert({
      store_id: newStore.id,
      user_id: user.id,
      name: userName,
      email: user.email,
      role: 'owner',
      status: 'active'
    });

    if (teamError) {
      console.error('Error auto-creando owner en team_members:', teamError);
    }
  }

  // 5. Redirigir al dashboard con éxito
  revalidatePath('/', 'layout');
  redirect(`/dashboard?success=${encodeURIComponent('Comercio creado correctamente.')}`);
}

export async function updateStoreSettings(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'UPDATE_STORE_SETTINGS');
  } catch (err: any) {
    redirect(`/settings?tab=company&error=${encodeURIComponent(err.message || 'Sin permisos para modificar la configuración de la empresa.')}`);
  }

  const name = (formData.get('name') as string || '').trim();
  const category = (formData.get('category') as string || activeStore.category).trim();
  const city = (formData.get('city') as string || '').trim();
  const logoUrl = (formData.get('logo_url') as string || '').trim();
  const contactPhone = (formData.get('contact_phone') as string || '').trim();
  const contactEmail = (formData.get('contact_email') as string || '').trim().toLowerCase();
  const currency = (formData.get('currency') as string || 'COP').trim();
  const timezone = (formData.get('timezone') as string || 'America/Bogota').trim();

  if (!name) {
    redirect(`/settings?tab=company&error=${encodeURIComponent('El nombre comercial es obligatorio.')}`);
  }

  const { error } = await supabase
    .from('stores')
    .update({
      name,
      category,
      city,
      logo_url: logoUrl || null,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
      currency,
      timezone
    })
    .eq('id', activeStore.id);

  if (error) {
    console.error('[UPDATE STORE ERROR]:', error);
    redirect(`/settings?tab=company&error=${encodeURIComponent(error.message || 'Error al actualizar el comercio.')}`);
  }

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'STORE_SETTINGS_UPDATED',
    entity: 'stores',
    entityId: activeStore.id,
    metadata: {
      name,
      currency,
      timezone,
      updated_by_role: securityCtx.role
    }
  });

  revalidatePath('/', 'layout');
  revalidatePath('/settings');
  redirect(`/settings?tab=company&success=${encodeURIComponent('Configuración empresarial guardada correctamente.')}`);
}
