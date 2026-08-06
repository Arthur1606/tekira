import { Card } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TransactionForm } from './TransactionForm';
import { getProducts } from '@/modules/inventory/services';
import { getUserStores } from '@/modules/stores/services';
import { redirect } from 'next/navigation';

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  
  const products = await getProducts(stores[0].id);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nuevo Movimiento</h1>
          <p className="text-sm text-zinc-400">Registra un ingreso o gasto de caja</p>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {resolvedSearchParams.error && (
          <div className="mb-6 p-4 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{resolvedSearchParams.error}</p>
          </div>
        )}
        {resolvedSearchParams.success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-start gap-3 text-sm font-medium">
            <p>{resolvedSearchParams.success}</p>
          </div>
        )}

        <TransactionForm products={products} />
      </Card>
    </div>
  );
}
