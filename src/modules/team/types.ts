export type TeamRole = 'owner' | 'admin' | 'employee';
export type TeamStatus = 'active' | 'inactive';

export interface TeamMember {
  id: string;
  store_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  employee_code?: string | null;
  role: TeamRole;
  status: TeamStatus;
  mfa_enabled?: boolean;
  created_at: string;
}

export const TEAM_ROLES: TeamRole[] = ['owner', 'admin', 'employee'];
