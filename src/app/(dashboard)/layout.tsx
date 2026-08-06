import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/modules/auth/actions';
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
    <div className="h-screen bg-[#09090B] flex flex-col font-sans text-zinc-100 overflow-hidden">
      
      {/* Header Fijo */}
      <header className="bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-20 w-full">
        
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <MobileNav />
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-100">
              TEKIRA<span className="text-indigo-600">●</span>
            </span>
          </Link>

          {/* Selector de Comercio Visual */}
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/70 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Store className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-300 truncate max-w-[200px]">{activeStore.name}</span>
          </div>
        </div>

        {/* Perfil & Acciones */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 rounded-full hover:bg-zinc-800 hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>

          {/* Menú de Usuario */}
          <UserDropdownMenu
            userName={userName}
            userEmail={user.email || ''}
            avatarLetter={avatarLetter}
            userRole={userRole}
            logoutAction={logout}
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
