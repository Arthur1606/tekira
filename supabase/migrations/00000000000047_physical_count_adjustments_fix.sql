-- Migración: Fase 13 PRE-RELEASE v2.13 - Registro de Ajustes Físicos y Recuento de Inventario
-- Archivo: 00000000000047_physical_count_adjustments_fix.sql

-- 1. Actualizar la función calculate_inventory_movement_delta para incluir todos los alias de tipos de movimiento (LOSS, DISCONTINUED, DAMAGE, MERMA, EXIT, ADJUSTMENT_NEGATIVE)
CREATE OR REPLACE FUNCTION calculate_inventory_movement_delta(p_type TEXT, p_quantity NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    v_type TEXT := UPPER(COALESCE(p_type, ''));
    v_qty NUMERIC := ABS(COALESCE(p_quantity, 0));
BEGIN
    -- MOVIMIENTOS QUE SUMAN (+)
    IF v_type IN ('IN', 'PURCHASE', 'ENTRY', 'ADJUSTMENT_POSITIVE', 'TRANSFER_IN', 'RETURN', 'INBOUND', 'BUY', 'COMPRA') THEN
        RETURN v_qty;
    -- MOVIMIENTOS QUE RESTAN (-)
    ELSIF v_type IN ('SALE', 'DAMAGE', 'LOSS', 'WASTE', 'MERMA', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'EXIT', 'OUTBOUND', 'DISCONTINUED', 'DESCONTINUADO') THEN
        RETURN -v_qty;
    ELSE
        -- Si no está clasificado pero trae signo negativo explícito
        IF p_quantity < 0 THEN
            RETURN -v_qty;
        ELSE
            RETURN v_qty;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Recalcular existencias de productos y variantes con la regla actualizada
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
