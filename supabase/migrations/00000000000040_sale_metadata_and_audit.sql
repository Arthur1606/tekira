-- Migración: Fase 7 PRE-RELEASE v2.7 - Detalle, Control y Edición Segura de Ventas
-- Archivo: 00000000000040_sale_metadata_and_audit.sql

-- 1. Agregar campos administrativos opcionales a public.sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(30) DEFAULT 'mostrador';

-- 2. Crear tabla de auditoría para cambios administrativos (sale_audit_logs)
CREATE TABLE IF NOT EXISTS public.sale_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS en sale_audit_logs
ALTER TABLE public.sale_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view audit logs of their own store" ON public.sale_audit_logs;
CREATE POLICY "Users can view audit logs of their own store" ON public.sale_audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = sale_audit_logs.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = sale_audit_logs.store_id AND tm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert audit logs of their own store" ON public.sale_audit_logs;
CREATE POLICY "Users can insert audit logs of their own store" ON public.sale_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = sale_audit_logs.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = sale_audit_logs.store_id AND tm.user_id = auth.uid())
    );

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_sale_audit_logs_sale_id ON public.sale_audit_logs(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_audit_logs_store_id ON public.sale_audit_logs(store_id);
