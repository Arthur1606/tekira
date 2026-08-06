import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PurchaseForm } from './PurchaseForm';
import { getUserStores } from '@/modules/stores/services';
import { getSuppliers } from '@/modules/purchases/services';
import { getActiveCashSession } from '@/modules/transactions/services';

export default async function NewPurchasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];

  const activeSession = await getActiveCashSession(activeStore.id);

  // Get suppliers
  const suppliers = await getSuppliers(activeStore.id);

  // Get product variants for the selector with unit
  const { data: storeVariants } = await supabase
    .from('product_variants')
    .select(`
      id,
      name,
      sku,
      product_id,
      products!inner (
        store_id,
        name,
        category,
        unit
      )
    `)
    .eq('products.store_id', activeStore.id);

  const formattedVariants = storeVariants?.map(v => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    productName: (v.products as any).name,
    unit: (v.products as any).unit
  })) || [];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-24">
      <PurchaseForm 
        suppliers={suppliers} 
        variants={formattedVariants} 
        hasActiveSession={!!activeSession} 
      />
    </div>
  );
}
