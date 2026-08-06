-- Migración: Fase 15.1 - Seguridad SaaS TEKIRA y Aislamiento por Comercio
-- Archivo: 00000000000028_saas_security_hardening.sql

-- 1. Asegurar la existencia de la tabla security_logs y la columna store_id
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.security_logs 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 2. Asegurar índices de búsqueda de seguridad por store_id en todas las entidades
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_store_id ON public.inventory_locations(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_store_id ON public.inventory_transfers(store_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON public.suppliers(store_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON public.purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_openings_store_id ON public.cash_openings(store_id);
CREATE INDEX IF NOT EXISTS idx_cash_closings_store_id ON public.cash_closings(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON public.transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_team_members_store_user ON public.team_members(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_store_user ON public.security_logs(store_id, user_id);

-- 3. Reforzar RLS y políticas estrictas para security_logs (Audit Trail)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and admins can view security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Members can insert security logs" ON public.security_logs;
DROP POLICY IF EXISTS security_logs_select_policy ON public.security_logs;
DROP POLICY IF EXISTS security_logs_insert_policy ON public.security_logs;

CREATE POLICY security_logs_select_policy ON public.security_logs
    FOR SELECT USING (
        store_id IS NOT NULL AND public.is_store_member(store_id, ARRAY['owner', 'admin'])
    );

CREATE POLICY security_logs_insert_policy ON public.security_logs
    FOR INSERT WITH CHECK (
        store_id IS NULL OR public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee'])
    );
