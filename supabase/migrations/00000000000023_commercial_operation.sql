-- Migración: Fase 12.2 - Operación Comercial Real (Bodegas, Ubicaciones, SKU y Ventas por Empleado)
-- Archivo: 00000000000023_commercial_operation.sql

-- 1. Tabla de Ubicaciones Físicas (Tienda, Bodega, Almacén)
CREATE TABLE IF NOT EXISTS public.inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('store', 'warehouse', 'other')) DEFAULT 'store',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (store_id, name)
);

-- Habilitar RLS en inventory_locations
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros de store acceden a ubicaciones"
ON public.inventory_locations
FOR ALL
USING (public.is_store_member(store_id))
WITH CHECK (public.is_store_member(store_id));

-- 2. Tabla de Existencias por Ubicación (Stock Desglosado por Variante y Ubicación)
CREATE TABLE IF NOT EXISTS public.inventory_location_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (location_id, variant_id)
);

-- Habilitar RLS en inventory_location_stock
ALTER TABLE public.inventory_location_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros de store acceden a stock por ubicación"
ON public.inventory_location_stock
FOR ALL
USING (public.is_store_member(store_id))
WITH CHECK (public.is_store_member(store_id));

-- 3. Tabla de Transferencias entre Ubicaciones
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    from_location_id UUID NOT NULL REFERENCES public.inventory_locations(id),
    to_location_id UUID NOT NULL REFERENCES public.inventory_locations(id),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en inventory_transfers
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros de store acceden a transferencias"
ON public.inventory_transfers
FOR ALL
USING (public.is_store_member(store_id))
WITH CHECK (public.is_store_member(store_id));

-- 4. Extensión de Transacciones: Vendedor y Código de Empleado Obligatorio
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.inventory_locations(id);

-- 5. Auto-crear ubicación "Tienda Principal" por defecto en tiendas existentes que no tengan ubicaciones
DO $$
DECLARE
    r RECORD;
    v_loc_id UUID;
BEGIN
    FOR r IN SELECT id FROM public.stores LOOP
        IF NOT EXISTS (SELECT 1 FROM public.inventory_locations WHERE store_id = r.id) THEN
            INSERT INTO public.inventory_locations (store_id, name, type, status)
            VALUES (r.id, 'Tienda Principal', 'store', 'active')
            RETURNING id INTO v_loc_id;

            -- Vincular variantes existentes al stock de Tienda Principal
            INSERT INTO public.inventory_location_stock (store_id, location_id, variant_id, quantity)
            SELECT r.id, v_loc_id, pv.id, pv.quantity
            FROM public.product_variants pv
            JOIN public.products p ON pv.product_id = p.id
            WHERE p.store_id = r.id
            ON CONFLICT (location_id, variant_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 6. Trigger para auto-crear ubicación por defecto en tiendas nuevas
CREATE OR REPLACE FUNCTION public.create_default_store_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.inventory_locations (store_id, name, type, status)
    VALUES (NEW.id, 'Tienda Principal', 'store', 'active')
    ON CONFLICT (store_id, name) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_store_location ON public.stores;
CREATE TRIGGER trg_create_default_store_location
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.create_default_store_location();
