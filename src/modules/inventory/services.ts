import { createClient } from '@/lib/supabase/server';
import { Product, InventoryMovement } from './types';

export async function getProducts(storeId: string): Promise<Product[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*)
    `)
    .eq('store_id', storeId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data as Product[];
}

export async function getProduct(productId: string, storeId: string): Promise<Product | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants:product_variants(*)
    `)
    .eq('id', productId)
    .eq('store_id', storeId)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data as Product;
}

export async function getInventorySummary(storeId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('status')
    .eq('store_id', storeId);

  if (error) {
    return { total: 0, lowStock: 0, outOfStock: 0 };
  }

  let lowStock = 0;
  let outOfStock = 0;

  data.forEach((p) => {
    if (p.status === 'low_stock') lowStock++;
    if (p.status === 'out_of_stock') outOfStock++;
  });

  return {
    total: data.length,
    lowStock,
    outOfStock
  };
}

export async function getMovementHistory(productId: string, storeId: string) {
  const supabase = await createClient();

  // Obtener variantes asociadas al producto
  const { data: variants, error: varError } = await supabase
    .from('product_variants')
    .select('id, name, sku')
    .eq('product_id', productId);

  if (varError || !variants || variants.length === 0) {
    return [];
  }

  const variantIds = variants.map(v => v.id);
  const variantMap = new Map(variants.map(v => [v.id, v]));

  // Obtener movimientos de las variantes de este producto
  const { data: movements, error: movError } = await supabase
    .from('inventory_movements')
    .select('*')
    .in('variant_id', variantIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (movError || !movements) {
    console.error('Error fetching movement history:', movError);
    return [];
  }

  return movements.map(m => ({
    ...m,
    variant: variantMap.get(m.variant_id) || { name: 'Variante Principal', sku: '' }
  }));
}
