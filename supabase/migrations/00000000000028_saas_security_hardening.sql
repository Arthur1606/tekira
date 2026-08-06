-- Migración: Fase 15.1 - Seguridad SaaS TEKIRA y Aislamiento por Comercio
-- Archivo: 00000000000028_saas_security_hardening.sql

-- 1. Asegurar índices de búsqueda de seguridad por store_id en todas las entidades
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

-- 2. Reforzar política RLS estricta para security_logs (Audit Trail)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_logs_select_policy ON public.security_logs;
CREATE POLICY security_logs_select_policy ON public.security_logs
    FOR SELECT USING (
        public.is_store_member(store_id, ARRAY['owner', 'admin'])
    );

DROP POLICY IF EXISTS security_logs_insert_policy ON public.security_logs;
CREATE POLICY security_logs_insert_policy ON public.security_logs
    FOR INSERT WITH CHECK (
        public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee'])
    );
