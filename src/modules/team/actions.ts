'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStores } from '@/modules/stores/services';
import { TeamRole } from './types';
import { verifyPermission, logSecurityEvent } from '@/modules/security/services';

export async function addTeamMember(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) {
    redirect('/onboarding');
  }
  const activeStore = stores[0];

  // 2. Verificar rol y permisos (Solo Owner y Admin pueden gestionar personal)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'ADD_TEAM_MEMBER');
  } catch (err: any) {
    redirect(`/settings?tab=team&error=${encodeURIComponent(err.message || 'Permisos insuficientes.')}`);
  }

  // 3. Extraer y sanitizar datos
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const role = formData.get('role') as TeamRole;

  if (!name) {
    redirect(`/team/new?error=${encodeURIComponent('El nombre es obligatorio.')}`);
  }

  if (!['admin', 'employee'].includes(role)) {
    redirect(`/team/new?error=${encodeURIComponent('Rol no válido seleccionado.')}`);
  }

  if (role === 'owner') {
    redirect(`/team/new?error=${encodeURIComponent('Solo puede haber un propietario principal por comercio.')}`);
  }

  // 4. Regla estricta de Roles:
  // - Solo el OWNER puede crear administradores
  // - Un ADMIN solo puede crear empleados
  if (role === 'admin') {
    if (securityCtx.role !== 'owner') {
      redirect(`/team/new?error=${encodeURIComponent('Solo el propietario (owner) del comercio puede crear administradores.')}`);
    }

    const confirmation = (formData.get('admin_confirmation') as string || '').trim();
    if (confirmation !== 'CONFIRMAR') {
      redirect(`/team/new?error=${encodeURIComponent('Debes escribir CONFIRMAR para autorizar el rol de administrador.')}`);
    }
  }

  // 5. Insertar integrante en la base de datos
  const { data: newMember, error } = await supabase
    .from('team_members')
    .insert({
      store_id: activeStore.id,
      name,
      email: email || null,
      role,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    redirect(`/team/new?error=${encodeURIComponent(error.message)}`);
  }

  // 6. Registro de Auditoría de Seguridad: USER_CREATED
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'USER_CREATED',
    entity: 'team_members',
    entityId: newMember?.id || null,
    metadata: {
      added_name: name,
      added_email: email,
      assigned_role: role,
      added_by_role: securityCtx.role
    }
  });

  revalidatePath('/team');
  revalidatePath('/settings');
  redirect('/settings?tab=team&success=Integrante agregado correctamente al equipo');
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  const activeStore = stores[0];

  if (!activeStore) redirect('/onboarding');

  try {
    await verifyPermission(activeStore.id, ['owner', 'admin', 'employee'], 'UPDATE_PROFILE');
  } catch (err: any) {
    redirect(`/settings?tab=profile&error=${encodeURIComponent(err.message || 'Permisos insuficientes.')}`);
  }

  const name = (formData.get('name') as string || '').trim();

  if (!name) {
    redirect(`/settings?tab=profile&error=${encodeURIComponent('El nombre de perfil no puede estar vacío.')}`);
  }

  // 1. Actualizar tabla profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id);

  if (profileError) {
    redirect(`/settings?tab=profile&error=${encodeURIComponent(profileError.message)}`);
  }

  // 2. Si el usuario está registrado en team_members, actualizar su nombre allí también
  await supabase
    .from('team_members')
    .update({ name })
    .eq('store_id', activeStore.id)
    .eq('user_id', user.id);

  // 3. Auditoría de seguridad
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: user.id,
    action: 'PROFILE_UPDATED',
    entity: 'profiles',
    entityId: user.id,
    metadata: { new_name: name }
  });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  redirect(`/settings?tab=profile&success=${encodeURIComponent('Perfil actualizado correctamente.')}`);
}

export async function updateTeamMember(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Control de Acceso y Roles (Solo Owner y Admin pueden actualizar equipo)
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner', 'admin'], 'UPDATE_TEAM_MEMBER');
  } catch (err: any) {
    redirect(`/settings?tab=team&error=${encodeURIComponent(err.message || 'Sin permisos para modificar el equipo.')}`);
  }

  const memberId = (formData.get('member_id') as string || '').trim();
  const name = (formData.get('name') as string || '').trim();
  const role = (formData.get('role') as string || '').trim() as 'admin' | 'employee';
  const status = (formData.get('status') as string || '').trim() as 'active' | 'inactive';

  if (!memberId || !name || !['admin', 'employee'].includes(role) || !['active', 'inactive'].includes(status)) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('Datos de formulario inválidos.')}`);
  }

  // 3. Obtener el miembro objetivo a modificar
  const { data: targetMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', memberId)
    .eq('store_id', activeStore.id)
    .single();

  if (!targetMember) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('El integrante seleccionado no existe.')}`);
  }

  // REGLAS JERÁRQUICAS DE ROL Y SEGURIDAD:
  // Rule A: El Owner NO se puede modificar ni desactivar
  if (targetMember.role === 'owner') {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'team_members',
      metadata: { reason: 'Intento de modificar al propietario principal' }
    });
    redirect(`/settings?tab=team&error=${encodeURIComponent('El propietario principal no puede ser modificado ni desactivado.')}`);
  }

  // Rule B: Un ADMIN solo puede gestionar empleados (no otros administradores)
  if (targetMember.role === 'admin' && securityCtx.role !== 'owner') {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'team_members',
      metadata: { reason: 'Admin intentó modificar a otro admin' }
    });
    redirect(`/settings?tab=team&error=${encodeURIComponent('Un administrador solo puede gestionar empleados.')}`);
  }

  // Rule C: Otorgar rol ADMIN sólo lo puede hacer el Owner
  if (role === 'admin' && targetMember.role !== 'admin' && securityCtx.role !== 'owner') {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'team_members',
      metadata: { reason: 'Admin intentó otorgar rol de administrador' }
    });
    redirect(`/settings?tab=team&error=${encodeURIComponent('Solo el propietario (owner) puede otorgar el rol de administrador.')}`);
  }

  // Rule D: Un usuario no puede modificar su propio rol desde este formulario
  if (targetMember.user_id === securityCtx.user.id && targetMember.role !== role) {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'team_members',
      metadata: { reason: 'Usuario intentó cambiar su propio rol' }
    });
    redirect(`/settings?tab=team&error=${encodeURIComponent('No puedes cambiar tu propio rol.')}`);
  }

  // 4. Aplicar actualización en team_members
  const { error: updateErr } = await supabase
    .from('team_members')
    .update({
      name,
      role,
      status
    })
    .eq('id', memberId)
    .eq('store_id', activeStore.id);

  if (updateErr) {
    redirect(`/settings?tab=team&error=${encodeURIComponent(updateErr.message)}`);
  }

  // 5. Registrar eventos específicos en security_logs
  if (targetMember.role !== role) {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'ROLE_CHANGED',
      entity: 'team_members',
      entityId: memberId,
      metadata: {
        previous_role: targetMember.role,
        new_role: role,
        target_name: name,
        changed_by_role: securityCtx.role
      }
    });
  }

  if (targetMember.status !== status && status === 'inactive') {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'USER_BLOCKED',
      entity: 'team_members',
      entityId: memberId,
      metadata: {
        blocked_name: name,
        previous_status: targetMember.status,
        blocked_by_role: securityCtx.role
      }
    });
  }

  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'USER_UPDATED',
    entity: 'team_members',
    entityId: memberId,
    metadata: {
      name,
      role,
      status,
      updated_by_role: securityCtx.role
    }
  });

  revalidatePath('/settings');
  revalidatePath('/team');
  redirect(`/settings?tab=team&success=${encodeURIComponent('Integrante actualizado correctamente.')}`);
}

export async function deleteTeamMember(formData: FormData) {
  const supabase = await createClient();

  // 1. Obtener comercio activo
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  // 2. Control de Acceso Estricto: ÚNICAMENTE el OWNER puede eliminar integrantes
  let securityCtx;
  try {
    securityCtx = await verifyPermission(activeStore.id, ['owner'], 'DELETE_TEAM_MEMBER');
  } catch (err: any) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('Permisos insuficientes. Solo el propietario (owner) puede eliminar integrantes.')}`);
  }

  const memberId = (formData.get('member_id') as string || '').trim();

  if (!memberId) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('ID de integrante no válido.')}`);
  }

  // 3. Obtener el integrante a eliminar
  const { data: targetMember } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', memberId)
    .eq('store_id', activeStore.id)
    .single();

  if (!targetMember) {
    redirect(`/settings?tab=team&error=${encodeURIComponent('El integrante seleccionado no existe.')}`);
  }

  // 4. Proteger al OWNER principal y prevenir auto-eliminación
  if (targetMember.role === 'owner' || targetMember.user_id === securityCtx.user.id) {
    await logSecurityEvent({
      storeId: activeStore.id,
      userId: securityCtx.user.id,
      action: 'UNAUTHORIZED_ACTION_ATTEMPT',
      entity: 'team_members',
      metadata: { reason: 'Intento de eliminar la cuenta del propietario principal' }
    });
    redirect(`/settings?tab=team&error=${encodeURIComponent('El propietario principal no puede eliminarse a sí mismo.')}`);
  }

  // 5. Eliminar de team_members
  const { error: deleteErr } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('store_id', activeStore.id);

  if (deleteErr) {
    redirect(`/settings?tab=team&error=${encodeURIComponent(deleteErr.message)}`);
  }

  // 6. Registrar evento en security_logs: USER_DELETED
  await logSecurityEvent({
    storeId: activeStore.id,
    userId: securityCtx.user.id,
    action: 'USER_DELETED',
    entity: 'team_members',
    entityId: memberId,
    metadata: {
      deleted_member_id: memberId,
      deleted_name: targetMember.name,
      deleted_email: targetMember.email,
      deleted_role: targetMember.role,
      deleted_by_role: securityCtx.role
    }
  });

  revalidatePath('/settings');
  revalidatePath('/team');
  redirect(`/settings?tab=team&success=${encodeURIComponent(`El integrante ${targetMember.name} fue eliminado correctamente.`)}`);
}
