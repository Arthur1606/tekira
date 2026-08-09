-- Migración: Fase 6 PRE-RELEASE v2.6 - Sistema de Ventas Carrito Multiproducto
-- Archivo: 00000000000039_multi_item_sales.sql

-- 1. Crear tabla de Ventas Principales (sales)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) DEFAULT 'TKR-EMP-000001',
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    sale_number VARCHAR(50),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    cash_session_id UUID REFERENCES public.cash_openings(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Crear tabla de Detalles de Venta (sale_items)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS en ambas tablas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS) para sales
DROP POLICY IF EXISTS "Users can manage sales of their own store" ON public.sales;
CREATE POLICY "Users can manage sales of their own store" ON public.sales
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = sales.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = sales.store_id AND tm.user_id = auth.uid())
    );

-- 5. Políticas de Seguridad (RLS) para sale_items
DROP POLICY IF EXISTS "Users can manage sale_items of their own store" ON public.sale_items;
CREATE POLICY "Users can manage sale_items of their own store" ON public.sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sales s
            JOIN public.stores st ON st.id = s.store_id
            WHERE s.id = sale_items.sale_id
            AND (st.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = s.store_id AND tm.user_id = auth.uid()))
        )
    );

-- 6. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
