'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';

export async function redeemPromoCodeAction(formData: FormData) {
  const supabase = await createClient();
  const stores = await getUserStores();
  
  if (stores.length === 0) {
    redirect('/onboarding');
  }
  
  const activeStore = stores[0];
  const promoCode = (formData.get('promo_code') as string || '').trim().toUpperCase();

  if (!promoCode) {
    redirect(`/settings?tab=plan&error=${encodeURIComponent('Por favor ingresa un código promocional válido.')}`);
  }

  // Llamar al RPC seguro (validará owner y aplicará cambios)
  const { error } = await supabase.rpc('redeem_promo_code', {
    p_store_id: activeStore.id,
    p_code: promoCode
  });

  if (error) {
    redirect(`/settings?tab=plan&error=${encodeURIComponent(error.message || 'Error al canjear el cupón.')}`);
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard', 'layout');
  redirect(`/settings?tab=plan&success=${encodeURIComponent('¡Cupón aplicado exitosamente! Ahora disfrutas de los beneficios de la Prueba Piloto Enterprise por 90 días.')}`);
}
