import { createClient } from '@/lib/supabase/server';
import { TeamRole, AuditAction, SecurityLog, SecurityContext } from './types';

/**
 * Valida de forma estricta en el servidor que el usuario actual tenga sesión activa,
 * permanezca como usuario activo del comercio y posea uno de los roles permitidos.
 * Si alguna regla falla o un usuario inactivo intenta operar, registra UNAUTHORIZED_ACTION_ATTEMPT en auditoría.
 */
export async function verifyPermission(
  storeId: string,
  allowedRoles: TeamRole[] = ['owner', 'admin', 'employee'],
  actionName = 'UNAUTHORIZED_ACTION_ATTEMPT'
): Promise<SecurityContext> {
  const supabase = await createClient();

  // 1. Validar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    if (storeId) {
      await logSecurityEvent({
        storeId,
        userId: null,
        action: 'UNAUTHORIZED_ACTION_ATTEMPT',
        entity: 'auth',
        metadata: { reason: 'No autenticado', attempted_action: actionName }
      });
    }
    throw new Error('No autenticado. Inicia sesión para continuar.');
  }

  if (!storeId) {
    throw new Error('ID de comercio no proporcionado.');
  }

  // 2. Verificar si el usuario es el Propietario (Owner) registrado en la tabla stores
  const { data: store } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', storeId)
    .single();

  let userRole: TeamRole | null = null;
  let userStatus = 'active';

  if (store && store.owner_id === user.id) {
    userRole = 'owner';
    userStatus = 'active';
  } else {
    // 3. Verificar en team_members si el usuario está registrado como empleado/admin
    const { data: member } = await supabase
      .from('team_members')
      .select('role, status')
      .eq('store_id', storeId)
      .eq('user_id', user.id)
      .single();

    if (member) {
      userRole = (member.role as TeamRole) || null;
      userStatus = member.status || 'inactive';
    }
  }

  if (!userRole) {
    await logSecurityEvent({
      storeId,
      userId: user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'security',
      metadata: { reason: 'Usuario no pertenece al comercio', attempted_action: actionName }
    });
    throw new Error('Acceso denegado. No perteneces a este comercio.');
  }

  if (userStatus !== 'active') {
    await logSecurityEvent({
      storeId,
      userId: user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'security',
      metadata: { reason: 'Usuario inactivo/bloqueado', role: userRole, attempted_action: actionName }
    });
    throw new Error('Tu cuenta de usuario se encuentra inactiva. Contacta al propietario del comercio.');
  }

  if (!allowedRoles.includes(userRole)) {
    await logSecurityEvent({
      storeId,
      userId: user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'security',
      metadata: { 
        reason: 'Rol insuficiente', 
        user_role: userRole, 
        required_roles: allowedRoles, 
        attempted_action: actionName 
      }
    });
    throw new Error(`Permisos insuficientes. Tu rol actual (${userRole}) no tiene autorización para esta acción.`);
  }

  return {
    user: {
      id: user.id,
      email: user.email || ''
    },
    storeId,
    role: userRole
  };
}

/**
 * Alias de compatibilidad para verifyPermission
 */
export async function verifyStoreAccessAndRole(
  storeId: string,
  allowedRoles: TeamRole[] = ['owner', 'admin', 'employee']
): Promise<SecurityContext> {
  return verifyPermission(storeId, allowedRoles);
}

/**
 * Registra un evento de seguridad de forma inmutable en la tabla security_logs.
 */
export async function logSecurityEvent({
  storeId,
  userId,
  action,
  entity,
  entityId,
  metadata = {}
}: {
  storeId: string;
  userId?: string | null;
  action: AuditAction | string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const supabase = await createClient();

    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalUserId = user?.id || null;
    }

    const { error } = await supabase.from('security_logs').insert({
      store_id: storeId,
      user_id: finalUserId,
      action,
      entity,
      entity_id: entityId || null,
      metadata: metadata || {}
    });

    if (error) {
      console.error('[SECURITY LOG ERROR]: No se pudo registrar el evento de auditoría:', error.message);
    }
  } catch (err) {
    console.error('[SECURITY LOG EXCEPTION]:', err);
  }
}

/**
 * Obtiene los registros de auditoría de seguridad del comercio (Solo para owner y admin).
 */
export async function getSecurityLogs(storeId: string, limit = 50): Promise<SecurityLog[]> {
  await verifyPermission(storeId, ['owner', 'admin'], 'GET_SECURITY_LOGS');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('security_logs')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error al obtener logs de seguridad:', error);
    return [];
  }

  return data as SecurityLog[];
}
