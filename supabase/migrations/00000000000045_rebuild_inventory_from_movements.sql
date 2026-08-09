-- Migración: Fase 11 PRE-RELEASE v2.11 - Corrección Crítica de Trigger de Inventario y Recuento Basado en Movimientos
-- Archivo: 00000000000045_rebuild_inventory_from_movements.sql

-- 1. Corregir función de Trigger update_product_inventory para calcular la SUMA REAL de movimientos
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_calc_stock NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    -- Recalcular stock real sumando todas las variaciones de la bitácora inventory_movements
    SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
    FROM public.inventory_movements
    WHERE product_id = NEW.product_id;

    SELECT COALESCE(min_stock, 5) INTO v_min_stock
    FROM public.products
    WHERE id = NEW.product_id;

    -- Determinar estado real según existencias calculadas
    IF v_calc_stock <= 0 THEN
        v_status := 'out_of_stock';
        v_calc_stock := GREATEST(0, v_calc_stock);
    ELSIF v_calc_stock <= v_min_stock THEN
        v_status := 'low_stock';
    ELSE
        v_status := 'available';
    END IF;

    -- Actualizar existencias exactas en la tabla products
    UPDATE public.products
    SET 
        quantity = v_calc_stock,
        current_stock = v_calc_stock,
        status = v_status
    WHERE id = NEW.product_id;

    -- Actualizar la variante si aplica
    IF NEW.variant_id IS NOT NULL THEN
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = NEW.variant_id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_calc_stock)
        WHERE id = NEW.variant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Asegurar que el trigger esté activo
DROP TRIGGER IF EXISTS trg_update_inventory ON public.inventory_movements;
CREATE TRIGGER trg_update_inventory
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_inventory();

-- 3. Reconstrucción completa de inventario para todos los comercios
DO $$
DECLARE
    v_prod RECORD;
    v_var RECORD;
    v_calc_stock NUMERIC(15,4);
    v_var_calc_stock NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    -- Recalcular productos
    FOR v_prod IN SELECT id, min_stock FROM public.products LOOP
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE product_id = v_prod.id;

        v_min_stock := COALESCE(v_prod.min_stock, 5);
        IF v_calc_stock <= 0 THEN
            v_status := 'out_of_stock';
            v_calc_stock := GREATEST(0, v_calc_stock);
        ELSIF v_calc_stock <= v_min_stock THEN
            v_status := 'low_stock';
        ELSE
            v_status := 'available';
        END IF;

        UPDATE public.products
        SET quantity = v_calc_stock,
            current_stock = v_calc_stock,
            status = v_status
        WHERE id = v_prod.id;
    END LOOP;

    -- Recalcular variantes
    FOR v_var IN SELECT id FROM public.product_variants LOOP
        SELECT COALESCE(SUM(quantity), 0) INTO v_var_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = v_var.id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_var_calc_stock)
        WHERE id = v_var.id;
    END LOOP;
END $$;
