'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Settings, Store, Users, Activity, ShoppingCart, Truck } from 'lucide-react';

export function DesktopNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Centro de Comando', icon: LayoutDashboard },
    { href: '/transactions/new', label: 'Movimientos', icon: Activity },
    { href: '/inventory', label: 'Inventario', icon: Store },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart },
    { href: '/dashboard/suppliers', label: 'Proveedores', icon: Truck },
    { href: '/settings?tab=team', label: 'Equipo', icon: Users },
  ];

  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <aside className="w-64 bg-[#18181B] border-r border-zinc-800 hidden lg:flex flex-col flex-shrink-0 z-10 h-full">
      <div className="p-6">
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl leading-none tracking-tighter">T</span>
          </div>
          <span className="font-bold text-xl text-zinc-100 tracking-tight">TEKIRA</span>
        </Link>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href.includes('tab=team') && pathname === '/settings' && pathname.includes('tab=team'));

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/50' 
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-zinc-800">
        <Link 
          href="/settings"
          prefetch={true} 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isSettingsActive
              ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/50'
              : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${isSettingsActive ? 'text-indigo-400' : ''}`} />
          Configuraciones
        </Link>
      </div>
    </aside>
  );
}
