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
    { href: '/inventory', label: 'Inventario', icon: Store },
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-72 max-w-[80vw] bg-[#18181B] border-r border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between">
              <Link href="/dashboard" prefetch={true} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-black text-xl leading-none tracking-tighter">T</span>
                </div>
                <span className="font-bold text-xl text-zinc-100 tracking-tight">TEKIRA</span>
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
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/50' 
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <Link 
                href="/settings"
                prefetch={true} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isSettingsActive
                    ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/50'
                    : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                }`}
              >
                <Settings className={`w-5 h-5 ${isSettingsActive ? 'text-indigo-400' : ''}`} />
                Configuraciones
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
