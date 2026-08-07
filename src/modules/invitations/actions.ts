'use server'

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';
import { checkStoreLimits } from '@/modules/subscriptions/services';
import { headers } from 'next/headers';

async function getAuthRedirectUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}/auth/callback`;
}

export interface InvitationData {
  id: string;
  store_id: string;
  store_name: string;
  company_code: string;
  email: string;
  role: 'admin' | 'employee';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  is_valid: boolean;
}

/**
 * Generar y enviar una nueva invitación de empleado
 */
export async function createInvitationAction(formData: FormData) {
  const supabase = await createClient();

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'CREATE_EMPLOYEE_INVITATION');
  } catch (err: any) {
    redirect(`/settings?tab=team&error=${encodeURIComponent(err.message || 'Permisos insuficientes.')}`);
  }

  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const role = (formData.get('role') as string || 'employee').trim() as 'admin' | 'employee';

  if (!email) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('El correo electrónico es obligatorio.')}`);
  }

  if (!['admin', 'employee'].includes(role)) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('Rol de invitación no válido.')}`);
  }

  if (role === 'admin' && securityCtx.role !== 'owner') {
    redirect(`/settings?tab=team&error=${encodeURIComponent('Solo el propietario principal puede invitar administradores.')}`);
  }

  // Validar límites de plan
  const limits = await checkStoreLimits(activeStore.id);
  if (!limits.canAddUser) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('Has alcanzado el límite de usuarios de tu suscripción.')}`);
  }

  // Generar token criptográfico único (48 chars hex)
  const token = crypto.randomBytes(24).toString('hex');

  // Invocar RPC SECURITY DEFINER para crear la invitación a prueba de RLS
  const { data: newInvite, error } = await supabase.rpc('create_team_invitation_rpc', {
    p_store_id: activeStore.id,
    p_email: email,
    p_role: role,
    p_token: token,
    p_created_by: securityCtx.user.id
  });

  if (error) {
    console.error('[CREATE INVITATION RPC ERROR]:', error);
    redirect(`/settings?tab=team&error=${encodeURIComponent('Error al generar la invitación: ' + error.message)}`);
  }

  // Preparar abstracción para envío de correo (Estructura lista para integración SMTP/API)
  await sendInvitationEmail({
    email,
    storeName: activeStore.name,
    role,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
  });

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'INVITATION_CREATED',
    entity: 'team_invitations',
    entityId: newInvite?.id || activeStore.id,
    metadata: { target_email: email, role, token }
  });

  revalidatePath('/settings');
  revalidatePath('/team');
  redirect(`/settings?tab=team&inviteToken=${token}&inviteEmail=${encodeURIComponent(email)}&inviteRole=${role}&inviteStore=${encodeURIComponent(activeStore.name)}&success=${encodeURIComponent(`Invitación generada exitosamente para ${email}. Copia el enlace de invitación.`)}`);
}

/**
 * Abstracción de servicio para envío de correo de invitación (Estructura lista para integración SMTP/Resend/SendGrid)
 */
export async function sendInvitationEmail({
  email,
  storeName,
  role,
  inviteUrl
}: {
  email: string;
  storeName: string;
  role: string;
  inviteUrl: string;
}): Promise<boolean> {
  // NOTA: Preparado para integradores SMTP / API (Resend / SendGrid / Nodemailer)
  console.log(`[SMTP/API PREPARATION] Invitación generada para ${email} (${storeName}): ${inviteUrl}`);
  return true;
}

export type InvitationDiagnosticReason = 
  | 'valid'
  | 'not_found'
  | 'cancelled'
  | 'accepted'
  | 'expired'
  | 'connection_error';

export interface InvitationValidationResult {
  invite: InvitationData | null;
  reason: InvitationDiagnosticReason;
  diagnosticMessage: string;
}

/**
 * Validar token de invitación con diagnóstico detallado por causas
 */
export async function validateInvitationToken(token: string): Promise<InvitationValidationResult> {
  const supabase = await createClient();

  if (!token || token.trim() === '') {
    return {
      invite: null,
      reason: 'not_found',
      diagnosticMessage: 'Token no especificado o vacío.'
    };
  }

  const { data, error } = await supabase.rpc('get_invitation_by_token', {
    p_token: token.trim()
  });

  if (error) {
    console.error('[INVITATION DB CONNECTION ERROR]:', error);
    return {
      invite: null,
      reason: 'connection_error',
      diagnosticMessage: `Error de conexión al consultar la base de datos (${error.message})`
    };
  }

  if (!data || data.length === 0) {
    return {
      invite: null,
      reason: 'not_found',
      diagnosticMessage: `Token no encontrado: La cadena de invitación no existe en la base de datos.`
    };
  }

  const row = data[0];
  const invite: InvitationData = {
    id: row.id,
    store_id: row.store_id,
    store_name: row.store_name,
    company_code: row.company_code,
    email: row.email,
    role: row.role as 'admin' | 'employee',
    status: row.status,
    expires_at: row.expires_at,
    is_valid: Boolean(row.is_valid)
  };

  if (row.status === 'cancelled') {
    return {
      invite,
      reason: 'cancelled',
      diagnosticMessage: `Invitación cancelada: El enlace para ${row.email} fue revocado por el administrador.`
    };
  }

  if (row.status === 'accepted') {
    return {
      invite,
      reason: 'accepted',
      diagnosticMessage: `Invitación ya utilizada: Esta invitación para ${row.email} ya fue aceptada previamente.`
    };
  }

  const isExpired = new Date(row.expires_at) <= new Date() || row.status === 'expired';
  if (isExpired) {
    return {
      invite,
      reason: 'expired',
      diagnosticMessage: `Invitación expirada: La vigencia de 7 días finalizó el ${new Date(row.expires_at).toLocaleString('es-ES')}.`
    };
  }

  return {
    invite,
    reason: 'valid',
    diagnosticMessage: `Invitación válida para ${row.email} en ${row.store_name}.`
  };
}

/**
 * Obtener detalles de una invitación pública por su token (Wrapper de compatibilidad)
 */
export async function getInvitationByToken(token: string): Promise<InvitationData | null> {
  const result = await validateInvitationToken(token);
  return result.invite && result.reason === 'valid' ? result.invite : null;
}

/**
 * Registrar un nuevo empleado aceptando una invitación pública (/invite/[token])
 */
export async function registerWithInvitationAction(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const token = (formData.get('token') as string || '').trim();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();
  const confirmPassword = (formData.get('confirm_password') as string || '').trim();

  if (!token || !name || !email || !password) {
    redirect(`/invite/${token}?error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  if (confirmPassword && password !== confirmPassword) {
    redirect(`/invite/${token}?error=${encodeURIComponent('Las contraseñas no coinciden. Verifícalas e intenta nuevamente.')}`);
  }

  if (password.length < 6) {
    redirect(`/invite/${token}?error=${encodeURIComponent('La contraseña debe tener al menos 6 caracteres.')}`);
  }

  // Validar invitación
  const invite = await getInvitationByToken(token);
  if (!invite || !invite.is_valid) {
    redirect(`/invite/${token}?error=${encodeURIComponent('La invitación no existe, ha expirado o ya fue utilizada.')}`);
  }

  // 1. Crear usuario en auth.users
  let { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });

  // Si Supabase devuelve error por limite de envio de emails o si ya existe la cuenta
  if (authErr && (authErr.message.toLowerCase().includes('rate limit') || authErr.message.toLowerCase().includes('already'))) {
    console.warn('[SUPABASE AUTH BYPASS]: Autenticando usuario invitado...', authErr.message);
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!loginErr && loginData.user) {
      authData = loginData;
      authErr = null;
    }
  }

  if (authErr) {
    if (authErr.message.toLowerCase().includes('already registered') || authErr.message.toLowerCase().includes('already exists')) {
      redirect(`/login?error=${encodeURIComponent('Tu correo ya está registrado en TEKIRA. Inicia sesión para continuar.')}`);
    }
    redirect(`/invite/${token}?error=${encodeURIComponent('Error al registrar usuario: ' + authErr.message)}`);
  }

  if (!authData.user) {
    redirect(`/invite/${token}?error=${encodeURIComponent('Error al registrar usuario en el servidor.')}`);
  }

  const userId = authData.user.id;

  // 2. Invocar RPC SECURITY DEFINER para asociar al comercio, team_members, employee_code y marcar la invitación como aceptada
  const { data: acceptRpc, error: rpcErr } = await supabase.rpc('accept_team_invitation_rpc', {
    p_token: token,
    p_user_id: userId,
    p_name: name
  });

  if (rpcErr) {
    console.error('[ACCEPT INVITATION RPC ERROR]:', rpcErr);
  }

  // Registrar consentimiento legal
  await supabase.from('legal_consents').insert({
    user_id: userId,
    terms_version: 'v0.12.0'
  });

  // Guardar token en cookie temporal para verificar en el onboarding y tras 2FA
  cookieStore.set('pending_invite_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600,
    path: '/'
  });

  // Registrar Auditoría en security_logs
  await logSecurityEvent({
    storeId: invite.store_id,
    userId,
    action: 'INVITATION_ACCEPTED',
    entity: 'team_invitations',
    entityId: invite.id,
    metadata: { email, role: invite.role, token }
  });

  await logSecurityEvent({
    storeId: invite.store_id,
    userId,
    action: 'USER_JOINED_STORE',
    entity: 'team_members',
    entityId: userId,
    metadata: { email, role: invite.role, employee_code: acceptRpc?.[0]?.out_employee_code || 'TKR-EMP-000001' }
  });

  revalidatePath('/', 'layout');
  redirect('/setup-mfa');
}
