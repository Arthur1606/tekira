-- Migración: Fase 10 PRE-RELEASE v2.10 - Trazabilidad Crítica de Inventario y Movimientos de Venta (SALE)
-- Archivo: 00000000000044_inventory_movements_traceability.sql

-- 1. Asegurar tabla public.inventory_movements con campos de referencia
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'SALE',
    quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
    previous_stock NUMERIC(15,4) DEFAULT 0,
    new_stock NUMERIC(15,4) DEFAULT 0,
    reason TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view inventory movements of their store" ON public.inventory_movements;
CREATE POLICY "Users can view inventory movements of their store" ON public.inventory_movements
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = inventory_movements.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = inventory_movements.store_id AND tm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert inventory movements of their store" ON public.inventory_movements;
CREATE POLICY "Users can insert inventory movements of their store" ON public.inventory_movements
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = inventory_movements.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = inventory_movements.store_id AND tm.user_id = auth.uid())
    );

-- 2. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_id ON public.inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_id ON public.inventory_movements(reference_id);

-- 3. Función RPC para recalcular inventario real basado en movimientos registrados
CREATE OR REPLACE FUNCTION recalculate_store_inventory(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
    v_prod RECORD;
    v_calc_stock NUMERIC(15,4);
BEGIN
    FOR v_prod IN SELECT id FROM public.products WHERE store_id = p_store_id LOOP
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE product_id = v_prod.id AND store_id = p_store_id;

        UPDATE public.products
        SET current_stock = GREATEST(0, v_calc_stock),
            quantity = GREATEST(0, v_calc_stock),
            status = CASE 
                WHEN v_calc_stock <= 0 THEN 'out_of_stock'
                WHEN v_calc_stock <= 5 THEN 'low_stock'
                ELSE 'available'
            END
        WHERE id = v_prod.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
