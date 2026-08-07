-- Migración: Fase 4 PRE-RELEASE v2.4 - Aprovisionamiento Comercio Demo e Integración App Móvil
-- Archivo: 00000000000037_mobile_demo_seed.sql

-- 1. Asegurar columnas de compatibilidad en la tabla public.products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC(15,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS current_stock NUMERIC(15,4);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Sincronizar datos existentes si es necesario
UPDATE public.products SET price = sale_price WHERE price IS NULL AND sale_price IS NOT NULL;
UPDATE public.products SET current_stock = quantity WHERE current_stock IS NULL AND quantity IS NOT NULL;

-- 2. Insertar productos de demostración con SKU y Variantes para sincronización app móvil -> web
DO $$
DECLARE
    v_store_id UUID;
BEGIN
    SELECT id INTO v_store_id FROM public.stores ORDER BY created_at ASC LIMIT 1;

    IF v_store_id IS NOT NULL THEN
        -- Insertar Camisa Polo con SKU y Variantes
        INSERT INTO public.products (
            store_id,
            name,
            sku,
            price,
            sale_price,
            current_stock,
            quantity,
            unit,
            min_stock,
            status,
            variants,
            category,
            is_deleted
        ) VALUES (
            v_store_id,
            'Camisa Polo TEKIRA',
            'CAMI0001',
            65000.00,
            65000.00,
            45,
            45,
            'unidad',
            10,
            'available',
            '["Negra M", "Blanca L", "Azul XL"]'::jsonb,
            'Ropa y Calzado',
            false
        )
        ON CONFLICT DO NOTHING;

        -- Insertar segundo producto demo
        INSERT INTO public.products (
            store_id,
            name,
            sku,
            price,
            sale_price,
            current_stock,
            quantity,
            unit,
            min_stock,
            status,
            variants,
            category,
            is_deleted
        ) VALUES (
            v_store_id,
            'Zapatos Deportivos Pro',
            'ZAPA0002',
            185000.00,
            185000.00,
            18,
            18,
            'par',
            5,
            'available',
            '["Talla 40", "Talla 41", "Talla 42"]'::jsonb,
            'Ropa y Calzado',
            false
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
