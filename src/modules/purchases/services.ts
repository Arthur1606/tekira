import { createClient } from '@/lib/supabase/server';
import { Supplier, Purchase, PurchaseItem } from './types';

export async function getSuppliers(storeId: string): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('store_id', storeId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }

  return data as Supplier[];
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching supplier:', error);
    return null;
  }

  return data as Supplier;
}

export async function getPurchases(storeId: string): Promise<(Purchase & { supplier: { name: string } })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }

  // Flatten the relation for easier mapping
  return (data as any[]).map(d => ({
    ...d,
    supplier: Array.isArray(d.supplier) ? d.supplier[0] : d.supplier
  }));
}

export async function getPurchaseDetails(purchaseId: string): Promise<any[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('purchase_items')
    .select(`
      *,
      variant:product_variants(
        name,
        sku,
        product:products(name, category)
      )
    `)
    .eq('purchase_id', purchaseId);

  if (error) {
    console.error('Error fetching purchase details:', error);
    return [];
  }

  return data;
}

export async function getPurchasesMetrics(storeId: string) {
  const supabase = await createClient();
  
  // Get all purchases for this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select('total_amount, supplier_id')
    .eq('store_id', storeId)
    .gte('created_at', firstDayOfMonth);

  if (error) {
    console.error('Error fetching purchases metrics:', error);
    return {
      totalMonth: 0,
      totalPurchases: 0,
      topSupplierId: null
    };
  }

  const totalMonth = purchases.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
  const totalPurchases = purchases.length;
  
  // Find top supplier
  const supplierCounts = purchases.reduce((acc, curr) => {
    acc[curr.supplier_id] = (acc[curr.supplier_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let topSupplierId = null;
  let maxCount = 0;
  for (const [id, count] of Object.entries(supplierCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topSupplierId = id;
    }
  }

  return {
    totalMonth,
    totalPurchases,
    topSupplierId
  };
}
