'use client';

import { useState } from 'react';
import { toggleStoreStatusAction, SuperAdminStore } from '@/modules/superadmin/actions';
import { Badge } from '@/components/ui/Badge';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { Building, ShieldAlert, Power, Trash2, Eye, X, AlertTriangle, Users, MapPin, Calendar, Mail } from 'lucide-react';

interface SuperAdminStoreActionsModalProps {
  store: SuperAdminStore;
}

export function SuperAdminStoreActionsModal({ store }: SuperAdminStoreActionsModalProps) {
  const [activeModal, setActiveModal] = useState<'info' | 'delete' | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold text-xs">Activo</Badge>;
      case 'suspended':
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold text-xs">Suspendido</Badge>;
      case 'deleted':
        return <Badge variant="danger" className="bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold text-xs">Eliminado Demo</Badge>;
      default:
        return <Badge variant="neutral" className="font-bold text-xs">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        
        {/* Botón 1: Ver Información Básica */}
        <button
          type="button"
          onClick={() => setActiveModal('info')}
          className="p-2 text-zinc-400 hover:text-white hover:bg-[#1E2621] rounded-xl transition-colors border border-[#232C26]"
          title="Ver Información Básica"
        >
          <Eye className="w-4 h-4 text-[#8EA653]" />
        </button>

        {/* Botón 2: Suspender o Reactivar Comercio */}
        {store.status === 'active' ? (
          <form action={toggleStoreStatusAction}>
            <input type="hidden" name="store_id" value={store.id} />
            <input type="hidden" name="action" value="suspend" />
            <button
              type="submit"
              className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors border border-amber-500/30"
              title="Suspender Comercio"
            >
              <Power className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form action={toggleStoreStatusAction}>
            <input type="hidden" name="store_id" value={store.id} />
            <input type="hidden" name="action" value="reactivate" />
            <button
              type="submit"
              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors border border-emerald-500/30"
              title="Reactivar Comercio"
            >
              <Power className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Botón 3: Eliminar Comercio Demo */}
        {store.status !== 'deleted' && (
          <button
            type="button"
            onClick={() => setActiveModal('delete')}
            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/30"
            title="Eliminar Comercio Demo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

      </div>

      {/* MODAL 1: INFORMACIÓN BÁSICA DEL COMERCIO */}
      {activeModal === 'info' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#141A16] rounded-3xl border border-[#232C26] p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#232C26] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#556B2F]/20 flex items-center justify-center border border-[#7C9A42]/30">
                <Building className="w-6 h-6 text-[#8EA653]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#F5F5F0]">{store.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(store.status)}
                  <span className="text-xs text-zinc-400 font-mono">ID: {store.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2"><Mail className="w-4 h-4 text-[#7C9A42]" /> Propietario:</span>
                <span className="font-bold text-[#F5F5F0]">{store.owner_name} ({store.owner_email})</span>
              </div>

              <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#7C9A42]" /> Categoría / Ubicación:</span>
                <span className="font-bold text-[#F5F5F0]">{store.category} - {store.city}</span>
              </div>

              <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2"><Users className="w-4 h-4 text-[#7C9A42]" /> Usuarios Activos:</span>
                <span className="font-bold font-mono text-[#8EA653]">{store.team_count} integrante(s)</span>
              </div>

              <div className="p-3 bg-[#0E1310] rounded-xl border border-[#232C26] flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#7C9A42]" /> Fecha de Registro:</span>
                <span className="font-mono text-zinc-300">{formatDate(store.created_at)}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-[#1E2621] hover:bg-[#28332C] text-[#F5F5F0] text-xs font-bold rounded-xl border border-[#232C26]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMACIÓN DE BORRADO DE COMERCIO DEMO */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141A16] rounded-3xl border border-rose-500/40 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#232C26] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/40">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-300">Eliminar Comercio Demo</h3>
                <span className="text-xs text-zinc-400 font-bold block">{store.name}</span>
              </div>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2 text-xs text-rose-300 leading-relaxed">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] text-rose-400">
                <AlertTriangle className="w-4 h-4" /> Advertencia de Acción Administrativa
              </div>
              <p>
                Esta acción eliminará todos los datos asociados al comercio demo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-400/90 font-mono text-[11px] pt-1">
                <li>Usuarios e integrantes asociados</li>
                <li>Catálogo de productos e inventario</li>
                <li>Movimientos y ventas de caja</li>
                <li>Configuraciones del comercio</li>
              </ul>
            </div>

            <form action={toggleStoreStatusAction} className="space-y-4">
              <input type="hidden" name="store_id" value={store.id} />
              <input type="hidden" name="action" value="delete" />

              <Input
                id="confirm_text"
                name="confirm_text"
                type="text"
                label="Para confirmar escribe la palabra ELIMINAR *"
                placeholder="ELIMINAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                className="font-mono text-center font-bold tracking-widest border-rose-500/40 focus:border-rose-500"
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 bg-[#1E2621] hover:bg-[#28332C] text-zinc-300 text-xs font-bold rounded-xl border border-[#232C26]"
                >
                  Cancelar
                </button>
                <SubmitButton
                  fullWidth
                  disabled={confirmText !== 'ELIMINAR'}
                  className="w-1/2 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Comercio
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
