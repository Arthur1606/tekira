-- Migración: Fase 14 PRE-RELEASE v2.14 - Corrección Absoluta de Signos y Descuento Automático de Ventas, Daños y Mermas
-- Archivo: 00000000000048_fix_inventory_movements_delta.sql

-- 1. Normalizar todas las cantidades registradas en public.inventory_movements
-- Ventas, Daños, Pérdidas, Mermas y Ajustes Negativos DEBEN ser siempre NEGATIVOS (-)
UPDATE public.inventory_movements
SET quantity = -ABS(quantity)
WHERE UPPER(type) IN ('SALE', 'DAMAGE', 'LOSS', 'WASTE', 'MERMA', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'EXIT', 'OUTBOUND', 'DISCONTINUED', 'DESCONTINUADO');

-- Entradas, Compras, Devoluciones y Ajustes Positivos DEBEN ser siempre POSITIVOS (+)
UPDATE public.inventory_movements
SET quantity = ABS(quantity)
WHERE UPPER(type) IN ('IN', 'PURCHASE', 'ENTRY', 'ADJUSTMENT_POSITIVE', 'TRANSFER_IN', 'RETURN', 'INBOUND', 'BUY', 'COMPRA');

-- 2. Crear Trigger BEFORE INSERT/UPDATE en inventory_movements para forzar el signo correcto antes de guardar
CREATE OR REPLACE FUNCTION normalize_inventory_movement_quantity()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT := UPPER(COALESCE(NEW.type, ''));
BEGIN
    IF v_type IN ('SALE', 'DAMAGE', 'LOSS', 'WASTE', 'MERMA', 'ADJUSTMENT_NEGATIVE', 'TRANSFER_OUT', 'EXIT', 'OUTBOUND', 'DISCONTINUED', 'DESCONTINUADO') THEN
        NEW.quantity := -ABS(NEW.quantity);
    ELSIF v_type IN ('IN', 'PURCHASE', 'ENTRY', 'ADJUSTMENT_POSITIVE', 'TRANSFER_IN', 'RETURN', 'INBOUND', 'BUY', 'COMPRA') THEN
        NEW.quantity := ABS(NEW.quantity);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_movement_quantity ON public.inventory_movements;
CREATE TRIGGER trg_normalize_movement_quantity
BEFORE INSERT OR UPDATE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION normalize_inventory_movement_quantity();

-- 3. Actualizar la función recalculate_store_inventory para recalcular con la suma de los deltas con signo
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
        -- Suma limpia directa de la columna quantity (que ahora está normalizada con signo exacto)
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
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
        SELECT COALESCE(SUM(quantity), 0) INTO v_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = v_target_variant_id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_calc_stock)
        WHERE id = v_target_variant_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Ejecutar recalculo general para actualizar stock en products
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

    FOR v_var IN SELECT id FROM public.product_variants LOOP
        SELECT COALESCE(SUM(quantity), 0) INTO v_var_calc_stock
        FROM public.inventory_movements
        WHERE variant_id = v_var.id;

        UPDATE public.product_variants
        SET quantity = GREATEST(0, v_var_calc_stock)
        WHERE id = v_var.id;
    END LOOP;
END $$;
