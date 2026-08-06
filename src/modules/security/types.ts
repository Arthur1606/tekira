export type TeamRole = 'owner' | 'admin' | 'employee';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGIN_SUCCESSFUL'
  | 'LOGIN_FAILED'
  | 'LOGOUT_SUCCESSFUL'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_BLOCKED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'UNAUTHORIZED_ACTION_ATTEMPT'
  | 'PROFILE_UPDATED'
  | 'TEAM_MEMBER_ADDED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'INVENTORY_MOVEMENT_ADDED'
  | 'TRANSACTION_CREATED'
  | 'SUPPLIER_CREATED'
  | 'PURCHASE_CREATED'
  | 'CASH_REGISTER_OPENED'
  | 'CASH_REGISTER_CLOSED'
  | 'CASH_CLOSED';

export interface SecurityLog {
  id: string;
  store_id: string;
  user_id: string | null;
  action: AuditAction | string;
  entity: string;
  entity_id: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SecurityContext {
  user: {
    id: string;
    email: string;
  };
  storeId: string;
  role: TeamRole;
}
