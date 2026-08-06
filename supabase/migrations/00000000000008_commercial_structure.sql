-- Migración: Estructura Comercial, Variantes y Vendedores
-- Archivo: 00000000000008_commercial_structure.sql

-- 1. Crear tabla product_variants
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
    cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Habilitar RLS en product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage variants of their own products"
ON public.product_variants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_variants.product_id
        AND s.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.owner_id = auth.uid()
    )
);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);

-- 3. Crear variantes por defecto para productos existentes (Migración de datos segura)
INSERT INTO public.product_variants (product_id, name, quantity, cost, sale_price)
SELECT id, 'Variante Principal', quantity, cost, sale_price
FROM public.products;

-- 4. Modificar inventory_movements para soportar variantes
ALTER TABLE public.inventory_movements
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Enlazar los movimientos existentes a las nuevas variantes por defecto
UPDATE public.inventory_movements im
SET variant_id = pv.id
FROM public.product_variants pv
WHERE im.product_id = pv.product_id AND pv.name = 'Variante Principal';

CREATE INDEX idx_inventory_movements_variant_id ON public.inventory_movements(variant_id);

-- 5. Modificar transactions para soportar vendedores y variantes
ALTER TABLE public.transactions
ADD COLUMN seller_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
ADD COLUMN variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Enlazar transacciones existentes a las nuevas variantes
UPDATE public.transactions t
SET variant_id = pv.id
FROM public.product_variants pv
WHERE t.product_id = pv.product_id AND pv.name = 'Variante Principal';

CREATE INDEX idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX idx_transactions_variant_id ON public.transactions(variant_id);

-- 6. Actualizar el trigger de inventario para trabajar con variantes
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_current_var_qty NUMERIC(15,4);
    v_new_var_qty NUMERIC(15,4);
    
    v_product_id UUID;
    v_min_stock NUMERIC(15,4);
    v_total_qty NUMERIC(15,4);
    v_status TEXT;
BEGIN
    -- Determinar a qué producto pertenece la variante
    IF NEW.variant_id IS NOT NULL THEN
        SELECT product_id INTO v_product_id
        FROM public.product_variants
        WHERE id = NEW.variant_id;
    ELSE
        -- Fallback de compatibilidad si insertan por product_id antiguo
        v_product_id := NEW.product_id;
        
        -- Asignar a la primera variante encontrada si no envían variant_id
        SELECT id INTO NEW.variant_id
        FROM public.product_variants
        WHERE product_id = v_product_id
        LIMIT 1;
    END IF;

    -- Actualizar cantidad de la variante
    IF NEW.variant_id IS NOT NULL THEN
        SELECT quantity INTO v_current_var_qty
        FROM public.product_variants
        WHERE id = NEW.variant_id;

        IF NEW.type = 'entry' THEN
            v_new_var_qty := v_current_var_qty + NEW.quantity;
        ELSIF NEW.type = 'exit' THEN
            v_new_var_qty := v_current_var_qty - NEW.quantity;
        END IF;

        IF v_new_var_qty < 0 THEN
            v_new_var_qty := 0;
        END IF;

        UPDATE public.product_variants
        SET quantity = v_new_var_qty
        WHERE id = NEW.variant_id;
    END IF;

    -- Recalcular cantidad total del producto sumando todas sus variantes
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_qty
    FROM public.product_variants
    WHERE product_id = v_product_id;

    -- Obtener stock minimo
    SELECT min_stock INTO v_min_stock
    FROM public.products
    WHERE id = v_product_id;

    -- Calcular nuevo estado del producto general
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
