'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Settings, Store, Users, Activity, ShoppingCart, Truck, TrendingUp } from 'lucide-react';

export function DesktopNav() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Centro de Comando', icon: LayoutDashboard },
    { href: '/transactions/new', label: 'Movimientos', icon: Activity },
    { href: '/sales/team-performance', label: 'Ventas Empleados', icon: TrendingUp },
    { href: '/inventory', label: 'Inventario & Bodega', icon: Store },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart },
    { href: '/dashboard/suppliers', label: 'Proveedores', icon: Truck },
    { href: '/team', label: 'Equipo', icon: Users },
  ];

  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <aside className="w-64 bg-[#0E1310] border-r border-[#1E2621] hidden lg:flex flex-col flex-shrink-0 z-10 h-full shadow-2xl">
      <div className="p-6">
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-3 mb-8 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#556B2F] to-[#3B4B20] rounded-xl flex items-center justify-center shadow-lg shadow-[#556B2F]/20 border border-[#7C9A42]/30 group-hover:scale-105 transition-transform">
            <span className="text-[#F5F5F0] font-black text-xl leading-none tracking-tighter">T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-[#F5F5F0] tracking-tight">TEKIRA</span>
            <span className="text-[10px] font-mono font-semibold text-[#8EA653]">Enterprise SaaS</span>
          </div>
        </Link>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-[#161D19] text-[#F5F5F0] shadow-sm border border-[#2B372F]' 
                    : 'text-zinc-400 hover:bg-[#141A16] hover:text-[#F5F5F0] border border-transparent'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#7C9A42] rounded-r-full shadow-sm shadow-[#7C9A42]" />
                )}
                <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-[#7C9A42]' : 'text-zinc-500 group-hover:text-[#7C9A42]'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-[#1E2621]">
        <Link 
          href="/settings"
          prefetch={true} 
          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
            isSettingsActive
              ? 'bg-[#161D19] text-[#F5F5F0] border border-[#2B372F]'
              : 'text-zinc-400 hover:bg-[#141A16] hover:text-[#F5F5F0]'
          }`}
        >
          <Settings className={`w-4 h-4 ${isSettingsActive ? 'text-[#7C9A42]' : 'text-zinc-500'}`} />
          Configuraciones
        </Link>
      </div>
    </aside>
  );
}
