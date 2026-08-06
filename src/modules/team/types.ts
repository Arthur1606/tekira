export type TeamRole = 'owner' | 'admin' | 'employee';
export type TeamStatus = 'active' | 'inactive';

export interface TeamMember {
  id: string;
  store_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role: TeamRole;
  status: TeamStatus;
  created_at: string;
}

export const TEAM_ROLES: TeamRole[] = ['owner', 'admin', 'employee'];
