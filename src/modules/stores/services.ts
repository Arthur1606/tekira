import { createClient } from '@/lib/supabase/server';
import { Store } from './types';

export async function getUserStores(): Promise<Store[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Vincular proactivamente cualquier registros de team_members sin user_id que coincida por correo
  if (user.email) {
    const cleanEmail = user.email.trim().toLowerCase();
    await supabase
      .from('team_members')
      .update({ user_id: user.id })
      .ilike('email', cleanEmail)
      .is('user_id', null);
  }

  // 2. Consulta 1: Comercios donde el usuario es el Propietario (owner_id)
  const { data: ownedStores, error: ownedErr } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (ownedStores && ownedStores.length > 0) {
    console.log(`[DEBUG AUTH LOG]: Usuario ${user.email} (${user.id}) identificado como OWNER del comercio ${ownedStores[0].name} (${ownedStores[0].id}).`);
    return ownedStores as Store[];
  }

  // 3. Consulta 2: Comercios donde el usuario pertenece como integrante activo (team_members) por user_id
  const { data: memberships, error: memErr } = await supabase
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
      .order('created_at', { ascending: true });

    if (memberStores && memberStores.length > 0) {
      console.log(`[DEBUG AUTH LOG]: Usuario ${user.email} (${user.id}) identificado como MEMBER [Rol: ${memberships[0].role}] del comercio ${memberStores[0].name} (${memberStores[0].id}).`);
      return memberStores as Store[];
    }
  }

  // 4. Consulta 3 (Respaldo por Correo): Buscar registros en team_members por email
  if (user.email) {
    const cleanEmail = user.email.trim().toLowerCase();
    const { data: emailMemberships } = await supabase
      .from('team_members')
      .select('store_id, role, status')
      .ilike('email', cleanEmail)
      .eq('status', 'active');

    if (emailMemberships && emailMemberships.length > 0) {
      const storeIds = emailMemberships.map(m => m.store_id);
      const { data: memberStores } = await supabase
        .from('stores')
        .select('*')
        .in('id', storeIds)
        .order('created_at', { ascending: true });

      if (memberStores && memberStores.length > 0) {
        console.log(`[DEBUG AUTH LOG]: Usuario ${user.email} (${user.id}) vinculado por EMAIL al comercio ${memberStores[0].name} (${memberStores[0].id}).`);
        return memberStores as Store[];
      }
    }
  }

  console.log(`[DEBUG AUTH LOG]: Usuario ${user.email} (${user.id}) no posee comercios asignados ni pertenece como integrante activo.`);
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
