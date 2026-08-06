import { createClient } from '@/lib/supabase/server';
import { TeamMember } from './types';

export async function getTeamMembers(storeId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('store_id', storeId)
    .order('role', { ascending: false }) // 'owner' va primero porque la 'o' es mayor que 'e' y 'a'. (Un poco hacky, mejor ordenar por fecha o dejar que el frontend ordene).
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  // Ordenar lógicamente: owner -> admin -> employee
  const roleWeight = { owner: 1, admin: 2, employee: 3 };
  return (data as TeamMember[]).sort((a, b) => roleWeight[a.role] - roleWeight[b.role]);
}
