import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Store, Bell } from 'lucide-react';
import Link from 'next/link';
import { getUserStores } from '@/modules/stores/services';
import { DesktopNav } from '@/components/ui/DesktopNav';
import { MobileNav } from '@/components/ui/MobileNav';
import { UserDropdownMenu } from '@/components/ui/UserDropdownMenu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // VERIFICACIÓN OBLIGATORIA DE 2FA TOTP: Ningún usuario puede operar el Dashboard sin 2FA activo
  const { data: mfaSetting } = await supabase
    .from('user_mfa_settings')
    .select('is_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!mfaSetting || !mfaSetting.is_enabled) {
    redirect('/setup-mfa');
  }

  // Verificar si el usuario tiene comercios
  const stores = await getUserStores();
  if (stores.length === 0) {
    redirect('/onboarding');
  }

  const activeStore = stores[0];

  // Obtener perfil y rol del usuario actual
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const userName = profile?.name || (user.email ? user.email.split('@')[0] : 'Usuario');

  let userRole: 'owner' | 'admin' | 'employee' = 'employee';
  if (activeStore.owner_id === user.id) {
    userRole = 'owner';
  } else {
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('store_id', activeStore.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    if (member?.role) {
      userRole = member.role as 'owner' | 'admin' | 'employee';
    }
  }

  const avatarLetter = userName.charAt(0).toUpperCase();

  return (
    <div className="h-screen bg-[#0B0F0D] flex flex-col font-sans text-[#F5F5F0] overflow-hidden">
      
      {/* Header Fijo */}
      <header className="bg-[#0B0F0D]/80 backdrop-blur-md border-b border-[#1E2621] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-20 w-full">
        
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <MobileNav />
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#556B2F] to-[#3B4B20] rounded-lg flex items-center justify-center border border-[#7C9A42]/30 shadow-sm shadow-[#556B2F]/10 lg:hidden">
              <span className="text-[#F5F5F0] font-black text-sm leading-none tracking-tighter">T</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F5F5F0] lg:hidden">
              TEKIRA
            </span>
          </Link>

          {/* Selector de Comercio Visual */}
          <div className="hidden md:flex items-center gap-2.5 bg-[#141A16] px-3.5 py-2 rounded-xl border border-[#232C26]">
            <Store className="w-4 h-4 text-[#7C9A42]" />
            <span className="text-xs font-bold text-zinc-300 truncate max-w-[200px]">{activeStore.name}</span>
          </div>
        </div>

        {/* Perfil & Acciones */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-zinc-400 hover:text-[#F5F5F0] transition-colors p-2 rounded-xl hover:bg-[#141A16] hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-[#232C26] hidden sm:block"></div>

          {/* Menú de Usuario con Props 100% Serializables */}
          <UserDropdownMenu
            userName={userName}
            userEmail={user.email || ''}
            avatarLetter={avatarLetter}
            userRole={userRole}
            storeName={activeStore.name}
            companyCode={activeStore.company_code}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full max-w-[1600px] mx-auto relative">
        {/* Sidebar Desktop Fijo */}
        <DesktopNav />

        {/* Content principal con scroll interno */}
        <main className="flex-1 h-full overflow-y-auto relative">
          <div className="p-4 sm:p-6 lg:p-10 w-full max-w-6xl mx-auto pb-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
