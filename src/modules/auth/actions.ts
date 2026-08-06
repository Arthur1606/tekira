'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/modules/security/services';

async function getAuthRedirectUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}/auth/callback`;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: (formData.get('email') as string || '').trim().toLowerCase(),
    password: (formData.get('password') as string || '').trim(),
  };

  if (!data.email || !data.password) {
    redirect(`/login?error=${encodeURIComponent('Ingresa correo y contraseña.')}`);
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signupOwner(formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get('name') as string || '').trim();
  const storeName = (formData.get('store_name') as string || '').trim();
  const category = (formData.get('category') as string || 'General').trim();
  const city = (formData.get('city') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!name || !storeName || !email || !password) {
    redirect(`/signup?mode=owner&error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  const emailRedirectTo = await getAuthRedirectUrl();

  // 1. Registro de usuario en Auth con emailRedirectTo dinámico
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: name,
      }
    }
  });

  if (authErr || !authData.user) {
    if (authErr?.message.toLowerCase().includes('already registered') || authErr?.message.toLowerCase().includes('already exists')) {
      redirect(`/signup?mode=owner&error=${encodeURIComponent('Este correo ya pertenece a un usuario registrado. Intenta iniciar sesión.')}`);
    }
    redirect(`/signup?mode=owner&error=${encodeURIComponent(authErr?.message || 'Error al crear la cuenta.')}`);
  }

  const userId = authData.user.id;

  // 2. Crear Comercio (el trigger SQL generará company_code automáticamente)
  const { data: newStore, error: storeErr } = await supabase
    .from('stores')
    .insert({
      name: storeName,
      category,
      city,
      owner_id: userId
    })
    .select()
    .single();

  if (storeErr || !newStore) {
    console.error('[SIGNUP STORE ERROR]:', storeErr);
    redirect(`/signup?mode=owner&error=${encodeURIComponent(storeErr?.message || 'Error al crear la empresa.')}`);
  }

  // 3. Registrar al Propietario en team_members
  await supabase.from('team_members').insert({
    store_id: newStore.id,
    user_id: userId,
    name,
    email,
    role: 'owner',
    status: 'active'
  });

  // 4. Registro de auditoría
  await logSecurityEvent({
    storeId: newStore.id,
    userId,
    action: 'USER_CREATED',
    entity: 'stores',
    entityId: newStore.id,
    metadata: {
      store_name: storeName,
      company_code: newStore.company_code,
      role: 'owner'
    }
  });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function joinCompany(formData: FormData) {
  const supabase = await createClient();

  const rawCode = (formData.get('company_code') as string || '').trim();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();

  if (!rawCode || !name || !email || !password) {
    redirect(`/signup?mode=join&error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  // Normalización estricta: trim y mayúsculas
  const cleanCode = rawCode.toUpperCase();

  // 1. Buscar comercio mediante RPC get_store_by_company_code (bypass RLS para usuarios no autenticados)
  const { data: rpcStores } = await supabase
    .rpc('get_store_by_company_code', { p_code: cleanCode });

  let targetStore: { id: string; name: string; company_code: string } | null = null;

  if (rpcStores && rpcStores.length > 0) {
    targetStore = rpcStores[0];
  } else {
    // Fallback: consulta directa ilike por si la función aún se está propagando
    const { data: storeFallback } = await supabase
      .from('stores')
      .select('id, name, company_code')
      .ilike('company_code', cleanCode)
      .maybeSingle();

    targetStore = storeFallback;
  }

  if (!targetStore) {
    redirect(`/signup?mode=join&error=${encodeURIComponent('El código de empresa no existe. Por favor verifica el código ingresado con el propietario de tu comercio.')}`);
  }

  const emailRedirectTo = await getAuthRedirectUrl();

  // 2. Intentar registrar el usuario en Supabase Auth con emailRedirectTo dinámico
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: name,
      }
    }
  });

  if (authErr) {
    console.error('[JOIN AUTH ERROR]:', authErr);
    if (authErr.message.toLowerCase().includes('already registered') || authErr.message.toLowerCase().includes('already exists')) {
      redirect(`/signup?mode=join&error=${encodeURIComponent('Este correo ya pertenece a un usuario registrado. Intenta iniciar sesión.')}`);
    }
    redirect(`/signup?mode=join&error=${encodeURIComponent(authErr.message)}`);
  }

  if (!authData.user) {
    redirect(`/signup?mode=join&error=${encodeURIComponent('Error al crear el usuario. Inténtalo de nuevo.')}`);
  }

  const userId = authData.user.id;

  // 3. Registrar al colaborador en team_members mediante la función RPC 'register_team_member_by_code'
  // Esta función SECURITY DEFINER evita que RLS bloquee la inserción de la membresía del nuevo usuario
  const { data: regResult, error: regErr } = await supabase.rpc('register_team_member_by_code', {
    p_company_code: cleanCode,
    p_user_id: userId,
    p_name: name,
    p_email: email
  });

  if (regErr) {
    console.error('[JOIN RPC MEMBER INSERT ERROR]:', regErr);
    // Fallback: intento de inserción directa por si la RPC no estuviese desplegada
    await supabase.from('team_members').insert({
      store_id: targetStore.id,
      user_id: userId,
      name,
      email,
      role: 'employee',
      status: 'active'
    });
  } else {
    console.log('[JOIN SUCCESSFUL MEMBER RECORD]:', regResult);
  }

  // 4. Auditoría de seguridad
  await logSecurityEvent({
    storeId: targetStore.id,
    userId,
    action: 'USER_CREATED',
    entity: 'team_members',
    metadata: {
      company_code: cleanCode,
      assigned_role: 'employee',
      joined_via: 'COMPANY_CODE'
    }
  });

  revalidatePath('/', 'layout');
  redirect(`/dashboard?success=${encodeURIComponent(`Te has unido exitosamente a ${targetStore.name}`)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/login');
}
