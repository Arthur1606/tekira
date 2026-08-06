import { addMovement } from '@/modules/inventory/actions';
import { getProduct, getMovementHistory } from '@/modules/inventory/services';
import { getUserStores } from '@/modules/stores/services';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Clock, History, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MovementForm } from './MovementForm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NewMovementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const stores = await getUserStores();
  if (stores.length === 0) redirect('/onboarding');
  const activeStore = stores[0];
  
  const product = await getProduct(resolvedParams.id, activeStore.id);
  if (!product) redirect('/inventory');

  const history = await getMovementHistory(product.id, activeStore.id);

  const addMovementWithId = addMovement.bind(null, product.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'entry':
        return <Badge variant="success" className="gap-1"><ArrowUpRight className="w-3 h-3" /> Entrada</Badge>;
      case 'damage':
        return <Badge variant="danger" className="gap-1"><ArrowDownRight className="w-3 h-3" /> Daño</Badge>;
      case 'loss':
        return <Badge variant="warning" className="gap-1"><ArrowDownRight className="w-3 h-3" /> Merma</Badge>;
      case 'discontinued':
        return <Badge variant="neutral" className="gap-1"><ArrowDownRight className="w-3 h-3" /> Descont.</Badge>;
      case 'sale':
        return <Badge variant="primary" className="gap-1"><ArrowDownRight className="w-3 h-3" /> Venta</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const formattedVariants = (product.variants || []).map(v => ({
    id: v.id,
    name: v.name,
    quantity: Number(v.quantity),
    sku: v.sku || null
  }));

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-zinc-950/40 backdrop-blur-2xl rounded-2xl border border-white/[0.03]">
        <div className="flex items-center gap-4">
          <Link href="/inventory" className="p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">{product.name}</h1>
              <Badge variant="neutral" className="bg-zinc-800/80 text-xs px-2.5 py-0.5">{product.category}</Badge>
              {product.sku && (
                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                  SKU: {product.sku}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-400 mt-1">
              Stock Total Actual: <strong className="text-indigo-400 font-bold">{product.quantity} {product.unit}</strong>
            </p>
          </div>
        </div>

        <Link href="/inventory" className="shrink-0">
          <span className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800">
            Volver a Inventario
          </span>
        </Link>
      </div>

      {/* Sección Principal (Responsive Grid: 2 Col en Desktop, 1 Col en Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
        
        {/* Columna Izquierda: Formulario "Control de Stock" */}
        <div className="w-full">
          <Card noPadding className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800/80 pb-4">
              <Package className="w-5 h-5 text-indigo-500" /> Control de Stock
            </h2>

            {resolvedSearchParams.error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium">
                <p>{resolvedSearchParams.error}</p>
              </div>
            )}
            {resolvedSearchParams.success && (
              <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium">
                <p>{resolvedSearchParams.success}</p>
              </div>
            )}

            <MovementForm 
              productId={product.id} 
              productUnit={product.unit} 
              variants={formattedVariants}
              actionFn={addMovementWithId} 
            />
          </Card>
        </div>

        {/* Columna Derecha: Historial de Movimientos */}
        <div className="w-full">
          <Card noPadding className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800/80 pb-4">
              <History className="w-5 h-5 text-indigo-500" /> Historial de Movimientos
            </h2>

            {history.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center text-zinc-500">
                <Clock className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay movimientos registrados para este producto.</p>
              </div>
            ) : (
              <div>
                {/* VISTA DESKTOP: Tabla Limpia y Amplia */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800/80 text-zinc-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Fecha</th>
                        <th className="py-3 px-3">Tipo</th>
                        <th className="py-3 px-3">Variante</th>
                        <th className="py-3 px-3 text-right">Cantidad</th>
                        <th className="py-3 px-3">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-3 text-zinc-400 font-mono whitespace-nowrap">{formatDate(item.created_at)}</td>
                          <td className="py-3.5 px-3 whitespace-nowrap">{getMovementBadge(item.type)}</td>
                          <td className="py-3.5 px-3 font-semibold text-zinc-200">{item.variant?.name || 'Principal'}</td>
                          <td className={`py-3.5 px-3 text-right font-black whitespace-nowrap ${
                            item.type === 'entry' ? 'text-emerald-400' : 'text-zinc-300'
                          }`}>
                            {item.type === 'entry' ? '+' : '-'}{item.quantity} {product.unit}
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400 max-w-[180px] truncate" title={item.reason}>{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MÓVIL: Tarjetas Compactas */}
                <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between group">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getMovementBadge(item.type)}
                          <span className="text-xs font-bold text-zinc-200">{item.variant?.name}</span>
                        </div>
                        <p className="text-xs text-zinc-400">{item.reason}</p>
                        <span className="text-[10px] text-zinc-500 font-mono">{formatDate(item.created_at)}</span>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <span className={`text-base font-black ${
                          item.type === 'entry' ? 'text-emerald-400' : 'text-zinc-200'
                        }`}>
                          {item.type === 'entry' ? '+' : '-'}{item.quantity} {product.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}
