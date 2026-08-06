-- Migración: Hardening de Seguridad Empresarial y Auditoría (Fase 10.5) - Corregida
-- Archivo: 00000000000011_security_hardening.sql

-- 1. Función Auxiliar de Verificación de Membresía y Rol (SECURITY DEFINER protegida)
CREATE OR REPLACE FUNCTION public.is_store_member(
    p_store_id UUID,
    p_allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'employee']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_is_owner BOOLEAN;
    v_is_member BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL OR p_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar si es el dueño directo registrado en stores
    SELECT EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = p_store_id AND owner_id = v_user_id
    ) INTO v_is_owner;

    IF v_is_owner AND ('owner' = ANY(p_allowed_roles)) THEN
        RETURN TRUE;
    END IF;

    -- Verificar si es un miembro activo registrado en team_members con rol permitido
    SELECT EXISTS (
        SELECT 1 FROM public.team_members
        WHERE store_id = p_store_id
          AND user_id = v_user_id
          AND status = 'active'
          AND role = ANY(p_allowed_roles)
    ) INTO v_is_member;

    RETURN v_is_member;
END;
$$;

-- 2. TABLA: security_logs (Historial Inmutable de Auditoría)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Índices de Auditoría
CREATE INDEX IF NOT EXISTS idx_security_logs_store_id ON public.security_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);

-- RLS en security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Solo lectura para Owner y Admin del mismo comercio
DROP POLICY IF EXISTS "Owners and admins can view security logs" ON public.security_logs;
CREATE POLICY "Owners and admins can view security logs"
ON public.security_logs FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- Inserción permitida para miembros del comercio
DROP POLICY IF EXISTS "Members can insert security logs" ON public.security_logs;
CREATE POLICY "Members can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

-- NOTA: NO se definen políticas de UPDATE ni DELETE en security_logs para garantizar inmutabilidad.


-- 3. REVISION Y REFRACTORIZACION DE POLITICAS RLS EN TODAS LAS TABLAS DEL SISTEMA

-- ----------------------------------------------------
-- TABLA: stores
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
CREATE POLICY "Users can view own stores"
ON public.stores FOR SELECT
USING (owner_id = auth.uid() OR public.is_store_member(id, ARRAY['owner', 'admin', 'employee']));

DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
CREATE POLICY "Users can update own stores"
ON public.stores FOR UPDATE
USING (owner_id = auth.uid() OR public.is_store_member(id, ARRAY['owner']));

-- ----------------------------------------------------
-- TABLA: settings
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view settings of own stores" ON public.settings;
CREATE POLICY "Users can view settings of own stores"
ON public.settings FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

DROP POLICY IF EXISTS "Users can update settings of own stores" ON public.settings;
CREATE POLICY "Users can update settings of own stores"
ON public.settings FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- ----------------------------------------------------
-- TABLA: team_members
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view team members of their own stores" ON public.team_members;
CREATE POLICY "Users can view team members of their own stores"
ON public.team_members FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

DROP POLICY IF EXISTS "Users can insert team members for their own stores" ON public.team_members;
CREATE POLICY "Users can insert team members for their own stores"
ON public.team_members FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Users can update team members of their own stores" ON public.team_members;
CREATE POLICY "Users can update team members of their own stores"
ON public.team_members FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Users can delete team members of their own stores" ON public.team_members;
CREATE POLICY "Users can delete team members of their own stores"
ON public.team_members FOR DELETE
USING (public.is_store_member(store_id, ARRAY['owner']));

-- ----------------------------------------------------
-- TABLA: products
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage products of their own stores" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;

CREATE POLICY "Users can view products"
ON public.products FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

CREATE POLICY "Users can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can update products"
ON public.products FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can delete products"
ON public.products FOR DELETE
USING (public.is_store_member(store_id, ARRAY['owner']));

-- ----------------------------------------------------
-- TABLA: product_variants (Relación vía product_id -> products.store_id)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage variants of their own products" ON public.product_variants;
DROP POLICY IF EXISTS "Users can view variants" ON public.product_variants;
DROP POLICY IF EXISTS "Users can manage variants" ON public.product_variants;

CREATE POLICY "Users can view variants"
ON public.product_variants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin', 'employee'])
    )
);

CREATE POLICY "Users can manage variants"
ON public.product_variants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin'])
    )
);

-- ----------------------------------------------------
-- TABLA: inventory_movements (Relación vía variant_id -> product_variants -> products.store_id)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage movements for their own products" ON public.inventory_movements;
DROP POLICY IF EXISTS "Users can view inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Users can insert inventory movements" ON public.inventory_movements;

CREATE POLICY "Users can view inventory movements"
ON public.inventory_movements FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = inventory_movements.variant_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin', 'employee'])
    )
);

CREATE POLICY "Users can insert inventory movements"
ON public.inventory_movements FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.product_variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = variant_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin', 'employee'])
    )
);

-- ----------------------------------------------------
-- TABLA: transactions
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view transactions of their own stores" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their own stores" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions of their own stores" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions of their own stores" ON public.transactions;
DROP POLICY IF EXISTS "Users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON public.transactions;

CREATE POLICY "Users can view transactions"
ON public.transactions FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

-- Regla de inserción: Owner y Admin pueden registrar cualquier tipo (income/expense).
-- Employee solamente puede registrar ingresos (ventas).
CREATE POLICY "Users can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (
    public.is_store_member(store_id, ARRAY['owner', 'admin'])
    OR (
        public.is_store_member(store_id, ARRAY['employee'])
        AND type = 'income'
    )
);

CREATE POLICY "Users can update transactions"
ON public.transactions FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can delete transactions"
ON public.transactions FOR DELETE
USING (public.is_store_member(store_id, ARRAY['owner']));

-- ----------------------------------------------------
-- TABLA: suppliers
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage suppliers of their own stores" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can manage suppliers" ON public.suppliers;

CREATE POLICY "Users can view suppliers"
ON public.suppliers FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

CREATE POLICY "Users can manage suppliers"
ON public.suppliers FOR ALL
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- ----------------------------------------------------
-- TABLA: purchases
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage purchases of their own stores" ON public.purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert purchases" ON public.purchases;

CREATE POLICY "Users can view purchases"
ON public.purchases FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

CREATE POLICY "Users can insert purchases"
ON public.purchases FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- ----------------------------------------------------
-- TABLA: purchase_items (Relación vía purchase_id -> purchases.store_id)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can manage purchase items of their own stores" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can view purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can insert purchase items" ON public.purchase_items;

CREATE POLICY "Users can view purchase items"
ON public.purchase_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.purchases p
        WHERE p.id = purchase_items.purchase_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin', 'employee'])
    )
);

CREATE POLICY "Users can insert purchase items"
ON public.purchase_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.purchases p
        WHERE p.id = purchase_id
        AND public.is_store_member(p.store_id, ARRAY['owner', 'admin'])
    )
);

-- ----------------------------------------------------
-- TABLA: cash_openings
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view cash openings of their own stores" ON public.cash_openings;
DROP POLICY IF EXISTS "Users can insert cash openings for their own stores" ON public.cash_openings;
DROP POLICY IF EXISTS "Users can view cash openings" ON public.cash_openings;
DROP POLICY IF EXISTS "Users can insert cash openings" ON public.cash_openings;

CREATE POLICY "Users can view cash openings"
ON public.cash_openings FOR SELECT
USING (public.is_store_member(store_id, ARRAY['owner', 'admin', 'employee']));

CREATE POLICY "Users can insert cash openings"
ON public.cash_openings FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- ----------------------------------------------------
-- TABLA: cash_closings (Relación vía opening_id -> cash_openings.store_id)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view cash closings of their own stores" ON public.cash_closings;
DROP POLICY IF EXISTS "Users can insert cash closings for their own stores" ON public.cash_closings;
DROP POLICY IF EXISTS "Users can view cash closings" ON public.cash_closings;
DROP POLICY IF EXISTS "Users can insert cash closings" ON public.cash_closings;

CREATE POLICY "Users can view cash closings"
ON public.cash_closings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cash_openings co
        WHERE co.id = cash_closings.opening_id
        AND public.is_store_member(co.store_id, ARRAY['owner', 'admin', 'employee'])
    )
);

CREATE POLICY "Users can insert cash closings"
ON public.cash_closings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cash_openings co
        WHERE co.id = opening_id
        AND public.is_store_member(co.store_id, ARRAY['owner', 'admin'])
    )
);
