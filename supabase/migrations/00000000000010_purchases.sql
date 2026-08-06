-- Migración: Compras y Proveedores (Fase 10)
-- Archivo: 00000000000010_purchases.sql

-- 1. Crear tabla suppliers
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Crear tabla purchases
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Crear tabla purchase_items
CREATE TABLE public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,4) NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Modificar transactions para soportar compras
ALTER TABLE public.transactions
ADD COLUMN purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_purchase_id ON public.transactions(purchase_id);
CREATE INDEX idx_transactions_supplier_id ON public.transactions(supplier_id);

-- 5. Modificar inventory_movements para soportar compras
ALTER TABLE public.inventory_movements
ADD COLUMN purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE;

CREATE INDEX idx_inventory_movements_purchase_id ON public.inventory_movements(purchase_id);

-- 6. Habilitar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- 7. Crear Políticas de Seguridad (RLS) para suppliers
CREATE POLICY "Users can manage suppliers of their own stores"
ON public.suppliers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = suppliers.store_id
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

-- 8. Crear Políticas de Seguridad (RLS) para purchases
CREATE POLICY "Users can manage purchases of their own stores"
ON public.purchases FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = purchases.store_id
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

-- 9. Crear Políticas de Seguridad (RLS) para purchase_items
CREATE POLICY "Users can manage purchase items of their own stores"
ON public.purchase_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.purchases p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = purchase_items.purchase_id
        AND s.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.purchases p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = purchase_id
        AND s.owner_id = auth.uid()
    )
);

-- 10. Crear Índices de Optimización
CREATE INDEX idx_suppliers_store_id ON public.suppliers(store_id);
CREATE INDEX idx_purchases_store_id ON public.purchases(store_id);
CREATE INDEX idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at);
CREATE INDEX idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_variant_id ON public.purchase_items(variant_id);
