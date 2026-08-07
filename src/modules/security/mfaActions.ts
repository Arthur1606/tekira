'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { generateBase32Secret, buildOtpAuthUri, verifyTotpCode } from './totp';
import { logSecurityEvent, verifyPermission } from './services';
import { getUserStores } from '@/modules/stores/services';

export async function generateMfaSecret() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado.' };
  }

  // Consultar si ya existe configuración individual previa para este usuario
  const { data: existing } = await supabase
    .from('user_mfa_settings')
    .select('secret, is_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  let secret: string;

  if (existing?.is_enabled) {
    // Si la protección 2FA ya está habilitada, mantener su secreto individual intacto
    secret = existing.secret;
  } else {
    // Si aún no está activado, generar un secreto individual único fresco de 32 caracteres Base32 (20 bytes / 160 bits exactos)
    secret = generateBase32Secret(32);

    if (existing) {
      await supabase
        .from('user_mfa_settings')
        .update({ secret, is_enabled: false })
        .eq('user_id', user.id);
    } else {
      const { error: insertErr } = await supabase.from('user_mfa_settings').insert({
        user_id: user.id,
        secret,
        is_enabled: false
      });

      if (insertErr) {
        console.error('[MFA GENERATE SECRET ERROR]:', insertErr);
        return { error: 'Error al generar secreto 2FA individual.' };
      }
    }
  }

  const otpAuthUri = buildOtpAuthUri('TEKIRA', user.email || 'usuario', secret);

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(otpAuthUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (qrErr) {
    console.error('Error generating QR Data URL:', qrErr);
  }

  return {
    secret,
    otpAuthUri,
    qrDataUrl,
    isEnabled: existing?.is_enabled || false
  };
}

export async function enableMfa(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const code = (formData.get('code') as string || '').trim();

  const { data: mfaSetting } = await supabase
    .from('user_mfa_settings')
    .select('secret, is_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!mfaSetting || !mfaSetting.secret) {
    redirect(`/settings?tab=security&error=${encodeURIComponent('No se encontró configuración 2FA activa. Genera el código QR primero.')}`);
  }

  const isValid = verifyTotpCode(mfaSetting.secret, code);

  if (!isValid) {
    redirect(`/settings?tab=security&error=${encodeURIComponent('Código de 6 dígitos inválido. Verifica la hora de tu celular e intenta de nuevo.')}`);
  }

  const { error: updateErr } = await supabase
    .from('user_mfa_settings')
    .update({
      is_enabled: true,
      enabled_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateErr) {
    redirect(`/settings?tab=security&error=${encodeURIComponent('Error al activar 2FA.')}`);
  }

  const stores = await getUserStores();
  if (stores.length > 0) {
    await logSecurityEvent({
      storeId: stores[0].id,
      userId: user.id,
      action: 'MFA_ENABLED',
      entity: 'user_mfa_settings',
      metadata: { enabled_at: new Date().toISOString() }
    });
  }

  revalidatePath('/settings');
  redirect(`/settings?tab=security&success=${encodeURIComponent('¡Autenticación de Dos Factores (2FA) activada correctamente!')}`);
}

export async function enableMfaMandatoryAction(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const code = (formData.get('code') as string || '').trim();

  const { data: mfaSetting } = await supabase
    .from('user_mfa_settings')
    .select('secret, is_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!mfaSetting || !mfaSetting.secret) {
    redirect(`/setup-mfa?error=${encodeURIComponent('No se encontró secreto 2FA. Intenta de nuevo.')}`);
  }

  const isValid = verifyTotpCode(mfaSetting.secret, code);

  if (!isValid) {
    redirect(`/setup-mfa?error=${encodeURIComponent('Código de 6 dígitos incorrecto. Revisa tu aplicación e intenta de nuevo.')}`);
  }

  const { error: updateErr } = await supabase
    .from('user_mfa_settings')
    .update({
      is_enabled: true,
      enabled_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateErr) {
    redirect(`/setup-mfa?error=${encodeURIComponent('Error al activar 2FA.')}`);
  }

  // Marcar invitación pendiente como 'accepted' si provenía de un link de invitación
  const inviteToken = cookieStore.get('pending_invite_token')?.value;
  if (inviteToken) {
    await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_by: user.id
      })
      .eq('token', inviteToken);

    await supabase
      .from('employee_invitations')
      .update({
        status: 'accepted',
        accepted_by: user.id
      })
      .eq('token', inviteToken);
    
    cookieStore.delete('pending_invite_token');
  }

  const stores = await getUserStores();
  if (stores.length > 0) {
    await logSecurityEvent({
      storeId: stores[0].id,
      userId: user.id,
      action: 'MFA_ENABLED',
      entity: 'user_mfa_settings',
      metadata: { enabled_at: new Date().toISOString(), mandatory: true }
    });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function disableMfa() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { error } = await supabase
    .from('user_mfa_settings')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    redirect(`/settings?tab=security&error=${encodeURIComponent('Error al desactivar 2FA.')}`);
  }

  const stores = await getUserStores();
  if (stores.length > 0) {
    await logSecurityEvent({
      storeId: stores[0].id,
      userId: user.id,
      action: 'MFA_DISABLED',
      entity: 'user_mfa_settings',
      metadata: { disabled_at: new Date().toISOString() }
    });
  }

  revalidatePath('/settings');
  redirect(`/settings?tab=security&success=${encodeURIComponent('Autenticación de 2FA desactivada.')}`);
}

export async function verifyMfaLoginAction(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const pendingUserId = cookieStore.get('mfa_pending_user')?.value;

  if (!pendingUserId) {
    redirect('/login?error=${encodeURIComponent("Sesión expirada. Inicia sesión nuevamente.")}');
  }

  const code = (formData.get('code') as string || '').trim();

  const { data: mfaSetting } = await supabase
    .from('user_mfa_settings')
    .select('secret, is_enabled')
    .eq('user_id', pendingUserId)
    .maybeSingle();

  if (!mfaSetting || !mfaSetting.is_enabled || !mfaSetting.secret) {
    cookieStore.delete('mfa_pending_user');
    redirect('/dashboard');
  }

  const isValid = verifyTotpCode(mfaSetting.secret, code);

  if (!isValid) {
    redirect(`/login/mfa-verify?error=${encodeURIComponent('Código de 6 dígitos incorrecto. Revisa tu aplicación autenticadora.')}`);
  }

  // Limpiar cookie temporal de verificación 2FA
  cookieStore.delete('mfa_pending_user');

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function requestMfaReset(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const companyCode = (formData.get('company_code') as string || '').trim().toUpperCase();
  const reason = (formData.get('reason') as string || 'Dispositivo autenticador extraviado o formateado').trim();

  if (!email || !companyCode || !reason) {
    redirect(`/mfa-recovery?error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  // 1. Buscar comercio por código vía RPC get_store_by_company_code
  const { data: rpcStores } = await supabase.rpc('get_store_by_company_code', { p_code: companyCode });
  const store = rpcStores && rpcStores.length > 0 ? rpcStores[0] : null;

  if (!store) {
    redirect(`/mfa-recovery?error=${encodeURIComponent('El código de empresa no existe.')}`);
  }

  // 2. Buscar integrante en team_members
  const { data: member } = await supabase
    .from('team_members')
    .select('user_id, email')
    .eq('store_id', store.id)
    .ilike('email', email)
    .maybeSingle();

  if (!member || !member.user_id) {
    redirect(`/mfa-recovery?error=${encodeURIComponent('No se encontró un usuario registrado con ese correo en la empresa.')}`);
  }

  // 3. Insertar solicitud pendiente en mfa_reset_requests
  const { error: reqErr } = await supabase.from('mfa_reset_requests').insert({
    user_id: member.user_id,
    store_id: store.id,
    reason,
    status: 'pending'
  });

  if (reqErr) {
    console.error('[MFA RESET REQUEST ERROR]:', reqErr);
    redirect(`/mfa-recovery?error=${encodeURIComponent('Error al enviar la solicitud.')}`);
  }

  await logSecurityEvent({
    storeId: store.id,
    userId: member.user_id,
    action: 'MFA_RESET_REQUESTED',
    entity: 'mfa_reset_requests',
    metadata: { reason, email }
  });

  redirect(`/mfa-recovery?success=${encodeURIComponent('Solicitud enviada correctamente. El Propietario o Administrador de tu empresa debe aprobar el restablecimiento.')}`);
}

export async function approveMfaReset(formData: FormData) {
  const supabase = await createClient();
  const requestId = (formData.get('request_id') as string || '').trim();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'APPROVE_MFA_RESET');
  } catch (err: any) {
    redirect(`/settings?tab=security&error=${encodeURIComponent(err.message || 'Sin permisos para aprobar solicitudes.')}`);
  }

  // 1. Obtener solicitud pendiente
  const { data: resetReq } = await supabase
    .from('mfa_reset_requests')
    .select('id, user_id, store_id, status')
    .eq('id', requestId)
    .eq('store_id', activeStore.id)
    .maybeSingle();

  if (!resetReq || resetReq.status !== 'pending') {
    redirect(`/settings?tab=security&error=${encodeURIComponent('Solicitud no encontrada o ya procesada.')}`);
  }

  // 2. Desactivar y eliminar la configuración 2FA del usuario objetivo
  await supabase
    .from('user_mfa_settings')
    .delete()
    .eq('user_id', resetReq.user_id);

  // 3. Marcar la solicitud como 'approved'
  await supabase
    .from('mfa_reset_requests')
    .update({
      status: 'approved',
      reviewed_by: securityCtx.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId);

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'MFA_RESET_APPROVED',
    entity: 'mfa_reset_requests',
    entityId: requestId,
    metadata: { target_user_id: resetReq.user_id, approved_by_role: securityCtx.role }
  });

  revalidatePath('/settings');
  redirect(`/settings?tab=security&success=${encodeURIComponent('Solicitud aprobada. El usuario podrá configurar 2FA nuevamente.')}`);
}

export async function rejectMfaReset(formData: FormData) {
  const supabase = await createClient();
  const requestId = (formData.get('request_id') as string || '').trim();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'REJECT_MFA_RESET');
  } catch (err: any) {
    redirect(`/settings?tab=security&error=${encodeURIComponent(err.message || 'Sin permisos para rechazar solicitudes.')}`);
  }

  await supabase
    .from('mfa_reset_requests')
    .update({
      status: 'rejected',
      reviewed_by: securityCtx.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .eq('store_id', activeStore.id);

  revalidatePath('/settings');
  redirect(`/settings?tab=security&success=${encodeURIComponent('Solicitud de 2FA rechazada.')}`);
}
