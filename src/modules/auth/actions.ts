'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/modules/security/services';
import { checkStoreLimits } from '@/modules/subscriptions/services';

async function getAuthRedirectUrl() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}/auth/callback`;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const data = {
    email: (formData.get('email') as string || '').trim().toLowerCase(),
    password: (formData.get('password') as string || '').trim(),
  };

  if (!data.email || !data.password) {
    redirect(`/login?error=${encodeURIComponent('Ingresa correo y contraseña.')}`);
  }

  const { data: authResult, error } = await supabase.auth.signInWithPassword(data);

  if (error || !authResult.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message || 'Error al iniciar sesión.')}`);
  }

  const userId = authResult.user.id;

  // Consultar si el usuario posee 2FA TOTP activo
  const { data: mfaSetting } = await supabase
    .from('user_mfa_settings')
    .select('is_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (mfaSetting && mfaSetting.is_enabled) {
    cookieStore.set('mfa_pending_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 300, // 5 minutos para completar el desafío de 6 dígitos
      path: '/'
    });
    redirect('/login/mfa-verify');
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

  const { data: newStore, error: storeErr } = await supabase
    .from('stores')
    .insert({
      name: storeName,
      category,
      city,
      owner_id: userId,
      status: 'active',
      currency: 'COP',
      timezone: 'America/Bogota'
    })
    .select()
    .single();

  if (storeErr || !newStore) {
    console.error('[SIGNUP STORE ERROR]:', storeErr);
    redirect(`/signup?mode=owner&error=${encodeURIComponent(storeErr?.message || 'Error al crear la empresa.')}`);
  }

  await supabase.from('team_members').insert({
    store_id: newStore.id,
    user_id: userId,
    name,
    email,
    role: 'owner',
    status: 'active'
  });

  // Registrar consentimiento legal de Términos y Privacidad v0.12.0
  await supabase.from('legal_consents').insert({
    user_id: userId,
    terms_version: 'v0.12.0'
  });

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

  const cleanCode = rawCode.toUpperCase();

  const { data: rpcStores } = await supabase
    .rpc('get_store_by_company_code', { p_code: cleanCode });

  let targetStore: { id: string; name: string; company_code: string } | null = null;

  if (rpcStores && rpcStores.length > 0) {
    targetStore = rpcStores[0];
  } else {
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

  // Validar Límite de Usuarios del Plan SaaS Activo de la Empresa
  const limits = await checkStoreLimits(targetStore.id);
  if (!limits.canAddUser) {
    redirect(`/signup?mode=join&error=${encodeURIComponent(`La empresa "${targetStore.name}" ha alcanzado el límite de usuarios (${limits.usage.users.max}) de su plan SaaS actual (${limits.subscription.plan_tier}). El propietario debe solicitar un upgrade de plan.`)}`);
  }

  const emailRedirectTo = await getAuthRedirectUrl();

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

  const { data: regResult, error: regErr } = await supabase.rpc('register_team_member_by_code', {
    p_company_code: cleanCode,
    p_user_id: userId,
    p_name: name,
    p_email: email
  });

  if (regErr) {
    console.error('[JOIN RPC MEMBER INSERT ERROR]:', regErr);
    await supabase.from('team_members').insert({
      store_id: targetStore.id,
      user_id: userId,
      name,
      email,
      role: 'employee',
      status: 'active'
    });
  }

  // Registrar consentimiento legal de Términos y Privacidad v0.12.0
  await supabase.from('legal_consents').insert({
    user_id: userId,
    terms_version: 'v0.12.0'
  });

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
