'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/modules/security/services';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: (formData.get('email') as string || '').trim(),
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
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!name || !storeName || !email || !password) {
    redirect(`/signup?mode=owner&error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  // 1. Registro de usuario en Auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });

  if (authErr || !authData.user) {
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

  const companyCode = (formData.get('company_code') as string || '').trim().toUpperCase();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim();
  const password = (formData.get('password') as string || '').trim();

  if (!companyCode || !name || !email || !password) {
    redirect(`/signup?mode=join&error=${encodeURIComponent('Todos los campos son obligatorios.')}`);
  }

  // 1. Validar existencia del código de empresa
  const { data: targetStore } = await supabase
    .from('stores')
    .select('id, name, company_code')
    .eq('company_code', companyCode)
    .single();

  if (!targetStore) {
    redirect(`/signup?mode=join&error=${encodeURIComponent('Código de empresa no válido o inexistente. Verifica el código con tu administrador.')}`);
  }

  // 2. Registro de usuario en Supabase Auth
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });

  if (authErr || !authData.user) {
    redirect(`/signup?mode=join&error=${encodeURIComponent(authErr?.message || 'Error al crear la cuenta.')}`);
  }

  const userId = authData.user.id;

  // 3. Registrar al nuevo colaborador en team_members con rol inicial 'employee'
  const { error: memberErr } = await supabase.from('team_members').insert({
    store_id: targetStore.id,
    user_id: userId,
    name,
    email,
    role: 'employee',
    status: 'active'
  });

  if (memberErr) {
    console.error('[JOIN MEMBER ERROR]:', memberErr);
  }

  // 4. Auditoría de seguridad
  await logSecurityEvent({
    storeId: targetStore.id,
    userId,
    action: 'USER_CREATED',
    entity: 'team_members',
    metadata: {
      company_code: companyCode,
      assigned_role: 'employee',
      joined_via: 'COMPANY_CODE'
    }
  });

  revalidatePath('/', 'layout');
  redirect(`/dashboard?success=${encodeURIComponent(`Te has unido a ${targetStore.name} correctamente.`)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/login');
}
