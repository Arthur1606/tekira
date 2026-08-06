import { createClient } from '@/lib/supabase/server';

export interface SubscriptionData {
  id?: string;
  store_id: string;
  plan_tier: 'basic' | 'professional' | 'enterprise';
  status: 'trial' | 'active' | 'expired' | 'suspended';
  trial_ends_at: string;
  current_period_end: string;
  max_users: number;
  max_locations: number;
  max_products: number;
}

export interface StoreLimitsCheck {
  subscription: SubscriptionData;
  usage: {
    users: { current: number; max: number; isReached: boolean };
    locations: { current: number; max: number; isReached: boolean };
    products: { current: number; max: number; isReached: boolean };
  };
  canAddUser: boolean;
  canAddLocation: boolean;
  canAddProduct: boolean;
}

export interface SuperAdminMetrics {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  totalUsers: number;
  basicPlanStores: number;
  professionalPlanStores: number;
  enterprisePlanStores: number;
}

/**
 * Obtener la suscripción activa de un comercio
 */
export async function getStoreSubscription(storeId: string): Promise<SubscriptionData> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();

  if (error || !data) {
    // Si no existe registro aún, retornar fallback por defecto del plan Básico (Trial)
    return {
      store_id: storeId,
      plan_tier: 'basic',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      current_period_end: new Date(Date.now() + 14 * 86400000).toISOString(),
      max_users: 3,
      max_locations: 1,
      max_products: 50,
    };
  }

  return data as SubscriptionData;
}

/**
 * Verificar uso en tiempo real y validar límites del plan
 */
export async function checkStoreLimits(storeId: string): Promise<StoreLimitsCheck> {
  const supabase = await createClient();
  const subscription = await getStoreSubscription(storeId);

  // Consultar conteos actuales en tiempo real
  const [usersRes, locationsRes, productsRes] = await Promise.all([
    supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'active'),
    supabase.from('inventory_locations').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'active'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId).is('deleted_at', null),
  ]);

  const currentUsers = usersRes.count || 0;
  const currentLocations = locationsRes.count || 0;
  const currentProducts = productsRes.count || 0;

  const isEnterprise = subscription.plan_tier === 'enterprise';

  const maxUsers = isEnterprise ? 9999 : subscription.max_users;
  const maxLocations = isEnterprise ? 9999 : subscription.max_locations;
  const maxProducts = isEnterprise ? 9999 : subscription.max_products;

  const usersReached = !isEnterprise && currentUsers >= maxUsers;
  const locationsReached = !isEnterprise && currentLocations >= maxLocations;
  const productsReached = !isEnterprise && currentProducts >= maxProducts;

  return {
    subscription,
    usage: {
      users: { current: currentUsers, max: maxUsers, isReached: usersReached },
      locations: { current: currentLocations, max: maxLocations, isReached: locationsReached },
      products: { current: currentProducts, max: maxProducts, isReached: productsReached },
    },
    canAddUser: !usersReached,
    canAddLocation: !locationsReached,
    canAddProduct: !productsReached,
  };
}

/**
 * Consultar Métricas Agregadas de Super Admin (Sin Datos Operativos Privados)
 */
export async function getSuperAdminMetrics(): Promise<SuperAdminMetrics> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_saas_super_admin_metrics');

  if (error || !data || data.length === 0) {
    // Fallback manual seguro mediante conteos de alto nivel
    const [storesCount, activeStoresCount, usersCount] = await Promise.all([
      supabase.from('stores').select('id', { count: 'exact', head: true }),
      supabase.from('stores').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalStores: storesCount.count || 0,
      activeStores: activeStoresCount.count || 0,
      trialStores: activeStoresCount.count || 0,
      totalUsers: usersCount.count || 0,
      basicPlanStores: storesCount.count || 0,
      professionalPlanStores: 0,
      enterprisePlanStores: 0,
    };
  }

  const row = data[0];
  return {
    totalStores: Number(row.total_stores || 0),
    activeStores: Number(row.active_stores || 0),
    trialStores: Number(row.trial_stores || 0),
    totalUsers: Number(row.total_users || 0),
    basicPlanStores: Number(row.basic_plan_stores || 0),
    professionalPlanStores: Number(row.professional_plan_stores || 0),
    enterprisePlanStores: Number(row.enterprise_plan_stores || 0),
  };
}
