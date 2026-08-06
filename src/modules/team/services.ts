import { createClient } from '@/lib/supabase/server';
import { TeamMember } from './types';

export async function getTeamMembers(storeId: string): Promise<TeamMember[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching team members:', error);
    return [];
  }

  const userIds = data.map(m => m.user_id).filter(Boolean) as string[];

  // Consultar estado 2FA de los integrantes
  let mfaMap = new Map<string, boolean>();
  if (userIds.length > 0) {
    const { data: mfaList } = await supabase
      .from('user_mfa_settings')
      .select('user_id, is_enabled')
      .in('user_id', userIds);

    mfaMap = new Map((mfaList || []).map(m => [m.user_id, !!m.is_enabled]));
  }

  const membersWithMfa: TeamMember[] = data.map(m => ({
    ...m,
    mfa_enabled: m.user_id ? !!mfaMap.get(m.user_id) : false
  }));

  const roleWeight = { owner: 1, admin: 2, employee: 3 };
  return membersWithMfa.sort((a, b) => roleWeight[a.role] - roleWeight[b.role]);
}
