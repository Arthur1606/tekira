-- Migración: Módulo de Inventario
-- Archivo: 00000000000004_inventory.sql

-- 1. Crear tabla products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    min_stock NUMERIC(15,4) NOT NULL DEFAULT 5,
    status TEXT NOT NULL CHECK (status IN ('available', 'low_stock', 'out_of_stock')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Crear tabla inventory_movements
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
    quantity NUMERIC(15,4) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Crear Función y Trigger para automatizar el inventario
CREATE OR REPLACE FUNCTION update_product_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_current_qty NUMERIC(15,4);
    v_new_qty NUMERIC(15,4);
    v_min_stock NUMERIC(15,4);
    v_status TEXT;
BEGIN
    -- Obtener datos actuales del producto
    SELECT quantity, min_stock INTO v_current_qty, v_min_stock
    FROM public.products
    WHERE id = NEW.product_id;

    -- Calcular nueva cantidad
    IF NEW.type = 'entry' THEN
        v_new_qty := v_current_qty + NEW.quantity;
    ELSIF NEW.type = 'exit' THEN
        v_new_qty := v_current_qty - NEW.quantity;
    END IF;

    -- Calcular nuevo estado
    IF v_new_qty <= 0 THEN
        v_status := 'out_of_stock';
        v_new_qty := 0; -- Prevenir inventario negativo en este MVP
    ELSIF v_new_qty <= v_min_stock THEN
        v_status := 'low_stock';
    ELSE
        v_status := 'available';
    END IF;

    -- Actualizar el producto
    UPDATE public.products
    SET 
        quantity = v_new_qty,
        status = v_status
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory
AFTER INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_inventory();


-- 4. Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de Seguridad (RLS) para products
CREATE POLICY "Users can manage products of their own stores"
ON public.products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = products.store_id
        AND stores.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- 6. Crear Políticas de Seguridad (RLS) para inventory_movements
CREATE POLICY "Users can manage movements for their own products"
ON public.inventory_movements FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = inventory_movements.product_id
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

-- 7. Crear Índices
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
