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
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString(); // 7 días de vigencia

  const { data: newInvite, error } = await supabase
    .from('employee_invitations')
    .insert({
      store_id: activeStore.id,
      email,
      role,
      token,
      status: 'pending',
      created_by: securityCtx.user.id,
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) {
    console.error('[CREATE INVITATION ERROR]:', error);
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
    entity: 'employee_invitations',
    entityId: newInvite.id,
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

/**
 * Obtener detalles de una invitación pública por su token
 */
export async function getInvitationByToken(token: string): Promise<InvitationData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_invitation_by_token', {
    p_token: token.trim()
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
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

  if (!token || !name || !email || !password) {
    redirect(`/invite/${token}?error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  // Validar invitación
  const invite = await getInvitationByToken(token);
  if (!invite || !invite.is_valid) {
    redirect(`/invite/${token}?error=${encodeURIComponent('La invitación no existe, ha expirado o ya fue utilizada.')}`);
  }

  const emailRedirectTo = await getAuthRedirectUrl();

  // 1. Crear usuario en auth.users
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: name }
    }
  });

  if (authErr) {
    if (authErr.message.toLowerCase().includes('already registered') || authErr.message.toLowerCase().includes('already exists')) {
      redirect(`/login?error=${encodeURIComponent('Tu correo ya está registrado en TEKIRA. Inicia sesión para continuar.')}`);
    }
    redirect(`/invite/${token}?error=${encodeURIComponent(authErr.message)}`);
  }

  if (!authData.user) {
    redirect(`/invite/${token}?error=${encodeURIComponent('Error al registrar usuario.')}`);
  }

  const userId = authData.user.id;

  // 2. Insertar en team_members con el store_id y rol de la invitación (Trigger asigna TKR-EMP-000001)
  const { error: teamErr } = await supabase.from('team_members').insert({
    store_id: invite.store_id,
    user_id: userId,
    name,
    email,
    role: invite.role,
    status: 'active'
  });

  if (teamErr) {
    console.error('[INVITE TEAM MEMBER INSERT ERROR]:', teamErr);
  }

  // Registrar consentimiento legal
  await supabase.from('legal_consents').insert({
    user_id: userId,
    terms_version: 'v0.12.0'
  });

  // Guardar token en cookie temporal para marcar como 'accepted' tras 2FA
  cookieStore.set('pending_invite_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600,
    path: '/'
  });

  await logSecurityEvent({
    storeId: invite.store_id,
    userId,
    action: 'INVITATION_ACCEPTED_SIGNUP',
    entity: 'employee_invitations',
    entityId: invite.id,
    metadata: { email, role: invite.role, token }
  });

  revalidatePath('/', 'layout');
  redirect('/setup-mfa');
}
