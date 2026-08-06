'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const city = formData.get('city') as string;

  // 3. Insertar tienda y obtener su ID
  const { data: newStore, error } = await supabase.from('stores').insert({
    name,
    category,
    city,
    owner_id: user.id
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
      console.error('Error auto-creando owner:', teamError);
      // No rompemos la creación del comercio
    }
  }

  // 5. Redirigir al dashboard con éxito
  revalidatePath('/', 'layout');
  redirect(`/dashboard?success=${encodeURIComponent('Comercio creado correctamente.')}`);
}
