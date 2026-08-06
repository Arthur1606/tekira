'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Building, KeyRound, Copy, Check, ChevronDown, ShieldCheck, Users, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { logout } from '@/modules/auth/actions';

interface UserDropdownMenuProps {
  userName: string;
  userEmail: string;
  avatarLetter: string;
  userRole: 'owner' | 'admin' | 'employee';
  storeName?: string;
  companyCode?: string;
  employeeCode?: string;
}

export function UserDropdownMenu({
  userName,
  userEmail,
  avatarLetter,
  userRole,
  storeName,
  companyCode,
  employeeCode
}: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
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

  const copyCompanyCode = () => {
    if (companyCode) {
      navigator.clipboard.writeText(companyCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="primary" className="text-[10px] py-0 px-2 bg-indigo-500/20 text-indigo-300 font-bold">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="text-[10px] py-0 px-2 bg-purple-500/20 text-purple-300 font-bold">Administrador</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] py-0 px-2 bg-zinc-800 text-zinc-300 font-bold">Empleado</Badge>;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      
      {/* Botón de Avatar Interactivo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-zinc-800/60 transition-all focus:outline-none ring-1 ring-white/5 hover:ring-white/10"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-zinc-900 shrink-0">
          {avatarLetter}
        </div>
        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-xs font-bold text-zinc-200 truncate max-w-[110px]">{userName}</span>
          <span className="text-[10px] text-zinc-500 capitalize">{userRole}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
          
          {/* Cabecera del Usuario */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{storeName || 'TEKIRA'}</span>
              {getRoleBadge(userRole)}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shadow-inner shrink-0">
                {avatarLetter}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-zinc-100 truncate">{userName}</p>
                <p className="text-xs text-zinc-400 font-mono truncate">{userEmail}</p>
              </div>
            </div>

            {/* Código de Empleado & Estado 2FA */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] font-mono">
              <span className="text-zinc-400">Código: <strong className="text-indigo-300">{employeeCode || 'TKR-EMP-000001'}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 2FA Activo</span>
            </div>
          </div>

          {/* CÓDIGO DE EMPRESA: VISIBLE PARA OWNER / ADMIN */}
          {(userRole === 'owner' || userRole === 'admin') && companyCode && (
            <div className="px-4 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 my-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Código Empresa:
                </span>
                <button
                  type="button"
                  onClick={copyCompanyCode}
                  className="font-mono font-bold text-xs text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900/80 px-2 py-0.5 rounded-md border border-indigo-500/30 flex items-center gap-1.5 transition-colors group"
                  title="Copiar código de empresa"
                >
                  <span>{companyCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Opciones de Navegación del Centro Administrativo */}
          <div className="py-1">
            <Link
              href="/settings?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
            >
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Mi Perfil</span>
            </Link>

            <Link
              href="/settings?tab=security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
            >
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seguridad & 2FA</span>
            </Link>

            {(userRole === 'owner' || userRole === 'admin') && (
              <>
                <Link
                  href="/settings?tab=company"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
                >
                  <Building className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Información de la Empresa</span>
                </Link>

                <Link
                  href="/settings?tab=team"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
                >
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Gestión de Usuarios</span>
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-zinc-800/80 my-1"></div>

          {/* Cerrar Sesión */}
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </form>

          {/* Footer Versión */}
          <div className="border-t border-zinc-800/80 pt-2 pb-2 px-4 bg-zinc-950">
            <span className="text-[10px] text-zinc-500 font-mono block text-center">
              TEKIRA <span className="text-zinc-400">v0.12.1 Enterprise</span>
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
