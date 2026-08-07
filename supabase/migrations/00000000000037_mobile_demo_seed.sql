-- Migración: Fase 4 PRE-RELEASE v2.4 - Aprovisionamiento Comercio Demo e Integración App Móvil
-- Archivo: 00000000000037_mobile_demo_seed.sql

-- 1. Insertar productos de demostración con SKU y Variantes para sincronización app móvil -> web
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
            current_stock,
            min_stock,
            variants,
            category,
            is_deleted
        ) VALUES (
            v_store_id,
            'Camisa Polo TEKIRA',
            'CAMI0001',
            65000.00,
            45,
            10,
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
            current_stock,
            min_stock,
            variants,
            category,
            is_deleted
        ) VALUES (
            v_store_id,
            'Zapatos Deportivos Pro',
            'ZAPA0002',
            185000.00,
            18,
            5,
            '["Talla 40", "Talla 41", "Talla 42"]'::jsonb,
            'Ropa y Calzado',
            false
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
