import { createClient } from '@/lib/supabase/server';
import { Store } from './types';

export async function getUserStores(): Promise<Store[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Invocar RPC con SECURITY DEFINER para vincular y consultar comercios (propietario o empleado)
  const { data: rpcStores, error: rpcErr } = await supabase.rpc('get_user_stores_rpc', {
    p_user_id: user.id,
    p_email: user.email || ''
  });

  if (!rpcErr && rpcStores && rpcStores.length > 0) {
    return rpcStores as Store[];
  }

  // 2. Fallback de Respaldo por Consulta Directa
  const { data: ownedStores } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (ownedStores && ownedStores.length > 0) {
    return ownedStores as Store[];
  }

  // 3. Fallback Respaldo Integrantes por team_members
  const { data: memberships } = await supabase
    .from('team_members')
    .select('store_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (memberships && memberships.length > 0) {
    const storeIds = memberships.map(m => m.store_id);
    const { data: memberStores } = await supabase
      .from('stores')
      .select('*')
      .in('id', storeIds)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (memberStores && memberStores.length > 0) {
      return memberStores as Store[];
    }
  }

  return [];
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
