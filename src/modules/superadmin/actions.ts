'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface SuperAdminMetrics {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  deletedStores: number;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
}

export interface SuperAdminStore {
  id: string;
  name: string;
  category: string;
  city: string;
  status: 'active' | 'suspended' | 'deleted' | 'trial' | 'expired';
  created_at: string;
  owner_email: string;
  owner_name: string;
  team_count: number;
}

/**
 * Verificar si el usuario autenticado tiene permisos de Super Admin
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase.rpc('is_super_admin_rpc', {
    p_user_id: user.id
  });

  if (error || !data) return false;
  return Boolean(data);
}

/**
 * Obtener métricas globales para el dashboard de Super Admin
 */
export async function getSuperAdminMetricsAction(): Promise<SuperAdminMetrics | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_super_admin_metrics_v2');

  if (error || !data || data.length === 0) {
    console.error('[SUPERADMIN METRICS ERROR]:', error);
    return null;
  }

  const row = data[0];
  return {
    totalStores: Number(row.total_stores || 0),
    activeStores: Number(row.active_stores || 0),
    suspendedStores: Number(row.suspended_stores || 0),
    deletedStores: Number(row.deleted_stores || 0),
    totalUsers: Number(row.total_users || 0),
    totalProducts: Number(row.total_products || 0),
    totalSales: Number(row.total_sales || 0),
  };
}

/**
 * Obtener la lista de comercios para gestión de plataforma Super Admin
 */
export async function getSuperAdminStoresAction(): Promise<SuperAdminStore[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_super_admin_stores_v2');

  if (error || !data) {
    console.error('[SUPERADMIN STORES FETCH ERROR]:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category || 'Sin categoría',
    city: row.city || 'No especificada',
    status: row.status || 'active',
    created_at: row.created_at,
    owner_email: row.owner_email || 'Sin correo',
    owner_name: row.owner_name || 'Sin nombre',
    team_count: Number(row.team_count || 0),
  }));
}

/**
 * Suspender, reactivar o borrar lógicamente un comercio desde Super Admin
 */
export async function toggleStoreStatusAction(formData: FormData) {
  const supabase = await createClient();

  const storeId = (formData.get('store_id') as string || '').trim();
  const action = (formData.get('action') as string || '').trim();
  const confirmText = (formData.get('confirm_text') as string || '').trim();

  if (!storeId || !action) {
    redirect(`/superadmin?error=${encodeURIComponent('Parámetros de acción inválidos.')}`);
  }

  if (action === 'delete' && confirmText !== 'ELIMINAR') {
    redirect(`/superadmin?error=${encodeURIComponent('Debes escribir la palabra ELIMINAR para confirmar el borrado del comercio demo.')}`);
  }

  const { error } = await supabase.rpc('toggle_store_status_rpc', {
    p_store_id: storeId,
    p_action: action
  });

  if (error) {
    console.error('[TOGGLE STORE STATUS ERROR]:', error);
    redirect(`/superadmin?error=${encodeURIComponent('Error al procesar acción: ' + error.message)}`);
  }

  revalidatePath('/superadmin');
  redirect(`/superadmin?success=${encodeURIComponent(`Acción "${action}" ejecutada exitosamente sobre el comercio.`)}`);
}
