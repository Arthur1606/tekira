-- Migración: Habilitar UPDATE RLS en cash_openings para permitir cierres de caja
-- Archivo: 00000000000017_cash_openings_update_policy.sql

-- 1. Asegurar política de UPDATE en cash_openings para owner y admin
DROP POLICY IF EXISTS "Users can update cash openings" ON public.cash_openings;
CREATE POLICY "Users can update cash openings"
ON public.cash_openings FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']))
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- 2. Asegurar política de UPDATE en cash_closings si fuera necesario
DROP POLICY IF EXISTS "Users can update cash closings" ON public.cash_closings;
CREATE POLICY "Users can update cash closings"
ON public.cash_closings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.cash_openings co
        WHERE co.id = cash_closings.opening_id
        AND public.is_store_member(co.store_id, ARRAY['owner', 'admin'])
    )
);
