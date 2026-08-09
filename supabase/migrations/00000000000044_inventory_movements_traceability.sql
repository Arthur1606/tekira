-- Migración: Fase 10 PRE-RELEASE v2.10 - Adaptación de inventory_movements y Trazabilidad Comercial
-- Archivo: 00000000000044_inventory_movements_traceability.sql

-- 1. Asegurar columnas opcionales en la tabla existente public.inventory_movements sin romper el esquema actual
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS previous_stock NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS new_stock NUMERIC(15,4) DEFAULT 0;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS reference_id UUID;

-- 2. Eliminar restricción de tipo rígida si existe para permitir 'SALE', 'RETURN', 'entry', 'exit'
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;

-- 3. Rellenar store_id para registros existentes mediante relación con public.products
UPDATE public.inventory_movements im
SET store_id = p.store_id
FROM public.products p
WHERE im.product_id = p.id AND im.store_id IS NULL;

-- 4. Habilitar y actualizar RLS de forma ultra-segura (funciona con o sin store_id directo)
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory movements of their store" ON public.inventory_movements;
CREATE POLICY "Users can view inventory movements of their store" ON public.inventory_movements
    FOR SELECT USING (
        (store_id IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.stores s WHERE s.id = inventory_movements.store_id AND s.owner_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = inventory_movements.store_id AND tm.user_id = auth.uid())
        ))
        OR
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON s.id = p.store_id
            WHERE p.id = inventory_movements.product_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = s.id AND tm.user_id = auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Users can insert inventory movements of their store" ON public.inventory_movements;
CREATE POLICY "Users can insert inventory movements of their store" ON public.inventory_movements
    FOR INSERT WITH CHECK (
        (store_id IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.stores s WHERE s.id = inventory_movements.store_id AND s.owner_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = inventory_movements.store_id AND tm.user_id = auth.uid())
        ))
        OR
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON s.id = p.store_id
            WHERE p.id = inventory_movements.product_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = s.id AND tm.user_id = auth.uid()))
        )
    );

-- 5. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_id ON public.inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_id ON public.inventory_movements(reference_id);

-- 6. Función RPC para recalcular inventario real basado en movimientos registrados
CREATE OR REPLACE FUNCTION recalculate_store_inventory(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
    v_prod RECORD;
    v_calc_stock NUMERIC(15,4);
BEGIN
    FOR v_prod IN SELECT id FROM public.products WHERE store_id = p_store_id LOOP
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE product_id = v_prod.id;

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
