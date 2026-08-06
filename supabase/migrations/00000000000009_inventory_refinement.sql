-- Migración: Perfeccionamiento de Inventario (Fase 9.7)
-- Archivo: 00000000000009_inventory_refinement.sql

-- 1. Agregar campo SKU a products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;

-- 2. Modificar el constraint de inventory_movements para aceptar los nuevos tipos
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;

ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_type_check 
CHECK (type IN ('entry', 'exit', 'sale', 'damage', 'loss', 'discontinued'));

-- 3. Actualizar el trigger update_product_inventory
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_product_id UUID;
    v_current_var_qty NUMERIC(15,4);
    v_new_var_qty NUMERIC(15,4);
    v_total_qty NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    -- Si por alguna razón el movimiento no tiene variant_id (datos muy antiguos), 
    -- intentamos usar el product_id si lo tiene, pero en la estructura nueva SIEMPRE debe tener variant_id.
    IF NEW.variant_id IS NULL THEN
        -- Fallback seguro para evitar colapsos
        RETURN NEW;
    END IF;

    -- Obtener el ID del producto padre y la cantidad actual de la variante
    SELECT p.id, p.min_stock, v.quantity 
    INTO v_product_id, v_min_stock, v_current_var_qty
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.id = NEW.variant_id;

    -- Calcular nueva cantidad para la variante
    IF NEW.type = 'entry' THEN
        v_new_var_qty := v_current_var_qty + NEW.quantity;
    ELSIF NEW.type IN ('exit', 'sale', 'damage', 'loss', 'discontinued') THEN
        v_new_var_qty := v_current_var_qty - NEW.quantity;
    END IF;

    -- Prevenir negativos
    IF v_new_var_qty < 0 THEN
        v_new_var_qty := 0;
    END IF;

    -- Actualizar cantidad en la variante específica
    UPDATE public.product_variants
    SET quantity = v_new_var_qty
    WHERE id = NEW.variant_id;

    -- Recalcular el total del producto base sumando todas sus variantes
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_qty
    FROM public.product_variants
    WHERE product_id = v_product_id;

    -- Calcular nuevo estado del producto padre
    IF v_total_qty <= 0 THEN
        v_status := 'out_of_stock';
    ELSIF v_total_qty <= v_min_stock THEN
        v_status := 'low_stock';
    ELSE
        v_status := 'available';
    END IF;

    -- Actualizar producto padre manteniendo compatibilidad de la columna antigua quantity
    UPDATE public.products
    SET 
        quantity = v_total_qty,
        status = v_status
    WHERE id = v_product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
