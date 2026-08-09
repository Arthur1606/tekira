-- Migración: Fase 12 PRE-RELEASE v2.12 - Clasificación de Dirección de Movimientos de Inventario (+ Entradas / - Salidas)
-- Archivo: 00000000000046_inventory_movement_direction_fix.sql

-- 1. Crear función para determinar la dirección exacta y delta con signo del movimiento
CREATE OR REPLACE FUNCTION calculate_inventory_movement_delta(p_type TEXT, p_quantity NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    v_type TEXT := UPPER(COALESCE(p_type, ''));
    v_qty NUMERIC := ABS(COALESCE(p_quantity, 0));
BEGIN
    -- MOVIMIENTOS QUE SUMAN (+)
    IF v_type IN ('IN', 'PURCHASE', 'ENTRY', 'ADJUSTMENT_POSITIVE', 'TRANSFER_IN', 'RETURN', 'INBOUND') THEN
        RETURN v_qty;
    -- MOVIMIENTOS QUE RESTAN (-)
    ELSIF v_type IN ('SALE', 'DAMAGE', 'LOSS', 'WASTE', 'MERMA', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'EXIT', 'OUTBOUND') THEN
        RETURN -v_qty;
    ELSE
        -- Fallback si el parámetro original ya era negativo o positivo
        RETURN p_quantity;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Actualizar función de trigger update_product_inventory para usar calculate_inventory_movement_delta
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_target_product_id UUID;
    v_target_variant_id UUID;
    v_calc_stock NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    v_target_product_id := COALESCE(NEW.product_id, OLD.product_id);
    v_target_variant_id := COALESCE(NEW.variant_id, OLD.variant_id);

    IF v_target_product_id IS NOT NULL THEN
        -- Recalcular existencias exactas sumando las entradas y restando las salidas
        SELECT COALESCE(SUM(calculate_inventory_movement_delta(type, quantity)), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE product_id = v_target_product_id;

        SELECT COALESCE(min_stock, 5) INTO v_min_stock
        FROM public.products
        WHERE id = v_target_product_id;

        IF v_calc_stock <= 0 THEN
            v_status := 'out_of_stock';
            v_calc_stock := GREATEST(0, v_calc_stock);
        ELSIF v_calc_stock <= v_min_stock THEN
            v_status := 'low_stock';
        ELSE
            v_status := 'available';
        END IF;

        UPDATE public.products
        SET 
            quantity = v_calc_stock,
            current_stock = v_calc_stock,
            status = v_status
        WHERE id = v_target_product_id;
    END IF;

    IF v_target_variant_id IS NOT NULL THEN
        SELECT COALESCE(SUM(calculate_inventory_movement_delta(type, quantity)), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = v_target_variant_id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_calc_stock)
        WHERE id = v_target_variant_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Asegurar que el trigger esté activo
DROP TRIGGER IF EXISTS trg_update_inventory ON public.inventory_movements;
CREATE TRIGGER trg_update_inventory
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_inventory();

-- 4. Reconstrucción completa de la base de datos aplicando la nueva regla (+ Entradas / - Salidas)
DO $$
DECLARE
    v_prod RECORD;
    v_var RECORD;
    v_calc_stock NUMERIC(15,4);
    v_var_calc_stock NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    FOR v_prod IN SELECT id, min_stock FROM public.products LOOP
        SELECT COALESCE(SUM(calculate_inventory_movement_delta(type, quantity)), 0) INTO v_calc_stock
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

    FOR v_var IN SELECT id FROM public.product_variants LOOP
        SELECT COALESCE(SUM(calculate_inventory_movement_delta(type, quantity)), 0) INTO v_var_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = v_var.id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_var_calc_stock)
        WHERE id = v_var.id;
    END LOOP;
END $$;
