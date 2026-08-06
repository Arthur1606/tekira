'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Building, Copy, Check, ChevronDown, ShieldCheck, Users, Lock, Scale } from 'lucide-react';
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
        return <Badge variant="primary" className="text-[10px] py-0.5 px-2 bg-[#556B2F]/20 text-[#8EA653] border-[#7C9A42]/30 font-bold">Propietario</Badge>;
      case 'admin':
        return <Badge variant="neutral" className="text-[10px] py-0.5 px-2 bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold">Administrador</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] py-0.5 px-2 bg-[#19201C] text-zinc-300 font-bold">Empleado</Badge>;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      
      {/* Botón de Avatar Interactivo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-[#141A16] transition-all focus:outline-none ring-1 ring-[#232C26]"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#556B2F] to-[#3B4B20] text-[#F5F5F0] flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-[#0B0F0D] shrink-0 border border-[#7C9A42]/30">
          {avatarLetter}
        </div>
        <div className="hidden md:flex flex-col items-start text-left">
          <span className="text-xs font-bold text-[#F5F5F0] truncate max-w-[110px]">{userName}</span>
          <span className="text-[10px] text-[#8EA653] capitalize font-mono font-semibold">{userRole}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#141A16] border border-[#232C26] rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
          
          {/* Cabecera del Usuario */}
          <div className="p-4 border-b border-[#232C26] bg-[#0E1310] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{storeName || 'TEKIRA'}</span>
              {getRoleBadge(userRole)}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-[#556B2F] text-white flex items-center justify-center font-extrabold text-base shadow-inner shrink-0 border border-[#7C9A42]/30">
                {avatarLetter}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-[#F5F5F0] truncate">{userName}</p>
                <p className="text-xs text-zinc-400 font-mono truncate">{userEmail}</p>
              </div>
            </div>

            {/* Código de Empleado & Estado 2FA */}
            <div className="flex items-center justify-between pt-2 border-t border-[#232C26] text-[11px] font-mono">
              <span className="text-zinc-400">Código: <strong className="text-[#8EA653]">{employeeCode || 'TKR-EMP-000001'}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 2FA Activo</span>
            </div>
          </div>

          {/* CÓDIGO DE EMPRESA */}
          {(userRole === 'owner' || userRole === 'admin') && companyCode && (
            <div className="px-4 py-2.5 bg-[#556B2F]/10 border-b border-[#7C9A42]/20 my-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5 text-[#7C9A42]" /> Código Empresa:
                </span>
                <button
                  type="button"
                  onClick={copyCompanyCode}
                  className="font-mono font-bold text-xs text-[#8EA653] bg-[#0E1310] hover:bg-[#19201C] px-2 py-0.5 rounded-md border border-[#7C9A42]/30 flex items-center gap-1.5 transition-colors group"
                  title="Copiar código de empresa"
                >
                  <span>{companyCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#8EA653]" />}
                </button>
              </div>
            </div>
          )}

          {/* Opciones de Navegación del Centro Administrativo */}
          <div className="py-1">
            <Link
              href="/settings?tab=profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#19201C] hover:text-[#F5F5F0] transition-colors"
            >
              <User className="w-4 h-4 text-[#7C9A42] shrink-0" />
              <span>Mi Perfil</span>
            </Link>

            <Link
              href="/settings?tab=security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#19201C] hover:text-[#F5F5F0] transition-colors"
            >
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seguridad & 2FA</span>
            </Link>

            {(userRole === 'owner' || userRole === 'admin') && (
              <>
                <Link
                  href="/settings?tab=company"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#19201C] hover:text-[#F5F5F0] transition-colors"
                >
                  <Building className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Información de la Empresa</span>
                </Link>

                <Link
                  href="/settings?tab=team"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#19201C] hover:text-[#F5F5F0] transition-colors"
                >
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Gestión de Usuarios</span>
                </Link>

                <Link
                  href="/settings?tab=legal"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-[#19201C] hover:text-[#F5F5F0] transition-colors"
                >
                  <Scale className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Información Legal</span>
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-[#232C26] my-1"></div>

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
          <div className="border-t border-[#232C26] pt-2 pb-2 px-4 bg-[#0E1310]">
            <span className="text-[10px] text-zinc-500 font-mono block text-center">
              TEKIRA <span className="text-[#8EA653]">v0.12.0 Enterprise</span>
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
