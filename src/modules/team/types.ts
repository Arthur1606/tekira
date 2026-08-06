export type TeamRole = 'owner' | 'admin' | 'employee';
export type TeamStatus = 'active' | 'inactive';

export interface TeamMemberPermissions {
  sales?: boolean;
  inventory?: boolean;
  purchases?: boolean;
  reports?: boolean;
  users?: boolean;
  finance?: boolean;
}

export interface TeamMember {
  id: string;
  store_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  employee_code?: string | null;
  role: TeamRole;
  status: TeamStatus;
  permissions?: TeamMemberPermissions;
  mfa_enabled?: boolean;
  created_at: string;
}

export const TEAM_ROLES: TeamRole[] = ['owner', 'admin', 'employee'];
