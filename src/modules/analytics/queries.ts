import { createClient } from '@/lib/supabase/server';
import { FinancialMetrics, InventoryMetrics, TeamMetrics, SalesTrend } from './types';

export async function getFinancialMetrics(storeId: string, sessionId?: string): Promise<FinancialMetrics> {
  const supabase = await createClient();
  let query = supabase.from('transactions').select('type, amount').eq('store_id', storeId);

  if (sessionId) {
    query = query.eq('cash_session_id', sessionId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching financial metrics:', error);
    return { totalIncome: 0, totalExpenses: 0, netBalance: 0, transactionCount: 0 };
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  data.forEach((tx) => {
    const amount = Number(tx.amount);
    if (tx.type === 'income') totalIncome += amount;
    if (tx.type === 'expense') totalExpenses += amount;
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: data.length,
  };
}

export async function getInventoryMetrics(storeId: string): Promise<InventoryMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('quantity, cost, status')
    .eq('store_id', storeId);

  if (error) {
    console.error('Error fetching inventory metrics:', error);
    return { totalProducts: 0, lowStockProducts: 0, inventoryValue: 0 };
  }

  let inventoryValue = 0;
  let lowStockProducts = 0;

  data.forEach((p) => {
    const qty = Number(p.quantity);
    const cost = Number(p.cost);
    inventoryValue += qty * cost;
    
    if (p.status === 'low_stock' || p.status === 'out_of_stock') {
      lowStockProducts++;
    }
  });

  return {
    totalProducts: data.length,
    lowStockProducts,
    inventoryValue,
  };
}

export async function getTeamMetrics(storeId: string): Promise<TeamMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('status')
    .eq('store_id', storeId);

  if (error) {
    console.error('Error fetching team metrics:', error);
    return { activeMembers: 0, totalMembers: 0 };
  }

  const activeMembers = data.filter((m) => m.status === 'active').length;

  return {
    activeMembers,
    totalMembers: data.length,
  };
}

export async function getIncomeTrend(storeId: string): Promise<SalesTrend[]> {
  const supabase = await createClient();
  
  // Calculate date 7 days ago
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('store_id', storeId)
    .eq('type', 'income')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching income trend:', error);
    return [];
  }

  // Initialize all 7 days with 0
  const trendMap = new Map<string, number>();
  for (let i = 0; i <= 6; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateString = d.toISOString().split('T')[0];
    trendMap.set(dateString, 0);
  }

  // Fill in actual data
  data.forEach((tx) => {
    const dateString = new Date(tx.created_at).toISOString().split('T')[0];
    if (trendMap.has(dateString)) {
      trendMap.set(dateString, trendMap.get(dateString)! + Number(tx.amount));
    }
  });

  // Convert map back to array
  const trend: SalesTrend[] = [];
  trendMap.forEach((amount, date) => {
    trend.push({ date, amount });
  });

  // Sort by date ascending just in case
  return trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
