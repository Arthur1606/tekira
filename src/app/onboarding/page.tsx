import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createStore } from '@/modules/stores/actions';
import { getUserStores } from '@/modules/stores/services';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { Store, MapPin, AlertCircle, Building2 } from 'lucide-react';

const CATEGORIES = [
  'Restaurante', 'Comidas rápidas', 'Panadería', 'Cafetería', 'Tienda de barrio', 
  'Minimercado', 'Supermercado', 'Ferretería', 'Licorería', 'Droguería', 
  'Papelería', 'Peluquería', 'Tienda de ropa', 'Calzado', 'Tecnología', 
  'Repuestos', 'Taller', 'Pañalera', 'Miscelánea', 'Veterinaria', 
  'Agropecuaria', 'Distribuidora', 'Otro'
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Usar la función centralizada que busca tanto comercios propios (owner) como por membresía (team_members)
  const stores = await getUserStores();
  if (stores && stores.length > 0) {
    redirect('/dashboard');
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] font-sans p-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-zinc-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-zinc-800 p-8 sm:p-12 relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-700">
        
        {/* Header Setup Card */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-500/20">
            <Building2 className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight mb-2">Dale un hogar a tu negocio</h1>
          <p className="text-zinc-400 font-medium">Configura tu comercio en segundos para acceder a tu panel de control.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form action={createStore} className="space-y-6">
          <Input
            id="name"
            name="name"
            type="text"
            label="Nombre Comercial"
            placeholder="Ej. Ferretería El Constructor"
            icon={Store}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="category">
              Sector de Negocio
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 text-sm text-zinc-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all focus:bg-zinc-950 appearance-none"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <Input
            id="city"
            name="city"
            type="text"
            label="Ciudad de Operación"
            placeholder="Ej. Medellín"
            icon={MapPin}
            required
          />

          <div className="pt-2">
            <SubmitButton fullWidth className="py-3 text-base font-bold shadow-sm">
              Comenzar a operar
            </SubmitButton>
          </div>
        </form>

      </div>
    </div>
  );
}
