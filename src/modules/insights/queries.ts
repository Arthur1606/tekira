import { createClient } from '@/lib/supabase/server';
import { FinancialInsightsData, InventoryInsightsData } from './types';

export async function getInventoryInsightsData(storeId: string): Promise<InventoryInsightsData> {
  const supabase = await createClient();

  // Fetch all products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, status, quantity, cost')
    .eq('store_id', storeId);

  if (prodError || !products) {
    return { lowStockProducts: [], lowRotationProducts: [], highestRotationProduct: null, highestValueProduct: null };
  }

  // Low stock
  const lowStockProducts = products
    .filter(p => p.status === 'low_stock' || p.status === 'out_of_stock')
    .map(p => ({ id: p.id, name: p.name, quantity: Number(p.quantity) }));

  // Highest value product
  let highestValueProduct = null;
  if (products.length > 0) {
    const sortedByValue = [...products].sort((a, b) => (Number(b.quantity) * Number(b.cost)) - (Number(a.quantity) * Number(a.cost)));
    const highestVal = sortedByValue[0];
    const val = Number(highestVal.quantity) * Number(highestVal.cost);
    if (val > 0) {
      highestValueProduct = { id: highestVal.id, name: highestVal.name, value: val };
    }
  }

  const productIds = products.map(p => p.id);
  
  if (productIds.length === 0) {
    return { lowStockProducts, lowRotationProducts: [], highestRotationProduct: null, highestValueProduct };
  }

  // Movements in last 30 days
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

  const { data: recentMovements, error: movError } = await supabase
    .from('inventory_movements')
    .select('product_id, quantity')
    .in('product_id', productIds)
    .gte('created_at', date30DaysAgo.toISOString());

  // Calculate rotation (quantity moved)
  const rotationMap = new Map<string, number>();
  (recentMovements || []).forEach(m => {
    rotationMap.set(m.product_id, (rotationMap.get(m.product_id) || 0) + Number(m.quantity));
  });

  // Low rotation
  const lowRotationProducts = products
    .filter(p => !rotationMap.has(p.id))
    .map(p => ({ id: p.id, name: p.name }));

  // Highest rotation
  let highestRotationProduct = null;
  if (rotationMap.size > 0) {
    let maxId = '';
    let maxQty = -1;
    rotationMap.forEach((qty, id) => {
      if (qty > maxQty) {
        maxQty = qty;
        maxId = id;
      }
    });
    const p = products.find(p => p.id === maxId);
    if (p && maxQty > 0) {
      highestRotationProduct = { id: p.id, name: p.name, quantity_moved: maxQty };
    }
  }

  return { lowStockProducts, lowRotationProducts, highestRotationProduct, highestValueProduct };
}

export async function getFinancialInsightsData(storeId: string): Promise<FinancialInsightsData> {
  const supabase = await createClient();

  const now = new Date();
  
  const date7DaysAgo = new Date();
  date7DaysAgo.setDate(now.getDate() - 7);
  
  const date14DaysAgo = new Date();
  date14DaysAgo.setDate(now.getDate() - 14);

  const [currentReq, previousReq] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('store_id', storeId)
      .eq('type', 'income')
      .gte('created_at', date7DaysAgo.toISOString())
      .lte('created_at', now.toISOString()),
    supabase
      .from('transactions')
      .select('amount')
      .eq('store_id', storeId)
      .eq('type', 'income')
      .gte('created_at', date14DaysAgo.toISOString())
      .lt('created_at', date7DaysAgo.toISOString())
  ]);

  const currentTxs = currentReq.data || [];
  
  const currentPeriodIncome = currentTxs.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const previousPeriodIncome = (previousReq.data || []).reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Calculate best day
  const dailyTotals = new Map<string, number>();
  currentTxs.forEach(tx => {
    const day = new Date(tx.created_at).toISOString().split('T')[0];
    dailyTotals.set(day, (dailyTotals.get(day) || 0) + Number(tx.amount));
  });

  let bestDay = null;
  if (dailyTotals.size > 0) {
    let maxDay = '';
    let maxAmt = -1;
    dailyTotals.forEach((amt, day) => {
      if (amt > maxAmt) {
        maxAmt = amt;
        maxDay = day;
      }
    });
    if (maxAmt > 0) {
      bestDay = { date: maxDay, amount: maxAmt };
    }
  }

  return { currentPeriodIncome, previousPeriodIncome, bestDay };
}
