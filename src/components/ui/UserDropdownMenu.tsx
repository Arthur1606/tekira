'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Building, KeyRound, Copy, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface UserDropdownMenuProps {
  userName: string;
  userEmail: string;
  avatarLetter: string;
  userRole: 'owner' | 'admin' | 'employee';
  storeName?: string;
  companyCode?: string;
  logoutAction: () => Promise<void>;
}

export function UserDropdownMenu({
  userName,
  userEmail,
  avatarLetter,
  userRole,
  storeName,
  companyCode,
  logoutAction
}: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="primary" className="text-[10px] py-0 px-2 bg-indigo-500/20 text-indigo-300">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="text-[10px] py-0 px-2 bg-purple-500/20 text-purple-300">Admin</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] py-0 px-2 bg-zinc-800 text-zinc-300">Empleado</Badge>;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      
      {/* Botón de Avatar Interactivo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-800/60 transition-all focus:outline-none ring-1 ring-white/5 hover:ring-white/10"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-zinc-900 shrink-0">
          {avatarLetter}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
          
          {/* Cabecera del Usuario */}
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40">
            <p className="text-sm font-bold text-zinc-100 truncate">{userName}</p>
            <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">{userEmail}</p>
            <div className="mt-2">
              {getRoleBadge(userRole)}
            </div>
          </div>

          {/* CÓDIGO DE EMPRESA: SOLO VISIBLE PARA ROLE === 'OWNER' */}
          {userRole === 'owner' && companyCode && (
            <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 my-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Empresa
                </span>
                <span className="font-bold text-zinc-200 truncate max-w-[130px]">{storeName}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-indigo-500/20 text-xs">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-indigo-400" /> Código:
                </span>
                
                <button
                  type="button"
                  onClick={copyCode}
                  className="font-mono font-bold text-xs text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/80 px-2 py-1 rounded-lg border border-indigo-500/30 flex items-center gap-1.5 transition-colors group"
                  title="Copiar código de empresa"
                >
                  <span>{companyCode}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-indigo-400 group-hover:text-indigo-200" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Opciones de Navegación */}
          <div className="py-1">
            <Link
              href="/settings?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
            >
              <User className="w-4 h-4 text-indigo-400" />
              <span>Mi Perfil</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Configuraciones</span>
            </Link>
          </div>

          <div className="border-t border-zinc-800/80 my-1"></div>

          {/* Cerrar Sesión */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Cerrar sesión</span>
            </button>
          </form>

          {/* Footer Versión */}
          <div className="border-t border-zinc-800/80 pt-2 pb-2 px-4 bg-zinc-950">
            <span className="text-[10px] text-zinc-500 font-mono block text-center">
              TEKIRA <span className="text-zinc-400">v0.10.5</span>
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
