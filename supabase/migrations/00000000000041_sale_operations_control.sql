-- Migración: Fase 8 PRE-RELEASE v2.8 - Control de Operaciones Comerciales, Secuencia Venta #000001 y Eliminación con Restauración de Inventario
-- Archivo: 00000000000041_sale_operations_control.sql

-- 1. Asegurar tabla public.customers si no existe
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage customers of their own store" ON public.customers;
CREATE POLICY "Users can manage customers of their own store" ON public.customers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = customers.store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.store_id = customers.store_id AND tm.user_id = auth.uid())
    );

-- 2. Asegurar campos en public.sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_number VARCHAR(50);

-- 3. Función RPC segura para generar la secuencia única por comercio: "Venta #000001"
CREATE OR REPLACE FUNCTION generate_next_sale_number(p_store_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INT;
    v_next_num TEXT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.sales WHERE store_id = p_store_id;
    v_next_num := 'Venta #' || lpad((v_count + 1)::text, 6, '0');
    RETURN v_next_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función RPC exclusiva para OWNER: delete_sale_and_restore_inventory
CREATE OR REPLACE FUNCTION delete_sale_and_restore_inventory(p_sale_id UUID, p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_sale_number TEXT;
    v_owner_id UUID;
BEGIN
    -- Validar que la persona ejecutando es realmente OWNER del comercio
    SELECT owner_id INTO v_owner_id FROM public.stores WHERE id = p_store_id;
    IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
        RAISE EXCEPTION 'Permisos insuficientes. Únicamente el propietario (owner) del comercio puede eliminar operaciones comerciales.';
    END IF;

    -- Obtener número de venta
    SELECT sale_number INTO v_sale_number FROM public.sales WHERE id = p_sale_id AND store_id = p_store_id;
    IF v_sale_number IS NULL THEN
        RAISE EXCEPTION 'Venta no encontrada.';
    END IF;

    -- 1. Restaurar inventario por cada producto vendido en la venta
    FOR v_item IN 
        SELECT product_id, quantity FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        UPDATE public.products
        SET current_stock = COALESCE(current_stock, 0) + v_item.quantity,
            quantity = COALESCE(quantity, 0) + v_item.quantity
        WHERE id = v_item.product_id AND store_id = p_store_id;
    END LOOP;

    -- 2. Eliminar transacciones de caja vinculadas
    DELETE FROM public.transactions WHERE store_id = p_store_id AND description LIKE '%' || v_sale_number || '%';

    -- 3. Eliminar la venta (sale_items y sale_audit_logs se eliminan por CASCADE)
    DELETE FROM public.sales WHERE id = p_sale_id AND store_id = p_store_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
