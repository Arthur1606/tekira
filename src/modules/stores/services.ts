import { createClient } from '@/lib/supabase/server';
import { Store } from './types';

export async function getUserStores(): Promise<Store[]> {
  const supabase = await createClient();
  
  // RLS garantiza que solo obtendremos los comercios del usuario logueado
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }

  return data as Store[];
}

export async function getStoreSettings(storeId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return data;
}
