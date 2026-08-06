'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Users, Store, Settings, Activity, ShoppingCart, Truck, TrendingUp } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="lg:hidden flex items-center">
      <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg">
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-72 max-w-[80vw] bg-[#0E1310] border-r border-[#1E2621] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between">
              <Link href="/dashboard" prefetch={true} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                <div className="w-9 h-9 bg-gradient-to-br from-[#556B2F] to-[#3B4B20] rounded-xl flex items-center justify-center shadow-lg shadow-[#556B2F]/20 border border-[#7C9A42]/30">
                  <span className="text-[#F5F5F0] font-black text-xl leading-none tracking-tighter">T</span>
                </div>
                <span className="font-extrabold text-xl text-[#F5F5F0] tracking-tight">TEKIRA</span>
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4 py-2 space-y-1.5 flex-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200
                      ${isActive 
                        ? 'bg-[#161D19] text-[#F5F5F0] border border-[#2B372F]' 
                        : 'text-zinc-400 hover:bg-[#141A16] hover:text-[#F5F5F0] border border-transparent'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C9A42]' : 'text-zinc-500'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#1E2621]">
              <Link 
                href="/settings"
                prefetch={true} 
                onClick={() => setIsOpen(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}
