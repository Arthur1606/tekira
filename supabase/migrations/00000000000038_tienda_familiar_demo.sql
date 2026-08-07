-- Migración: Fase 5 PRE-RELEASE v2.5 - Aprovisionamiento Comercio Piloto Real "Tienda Familiar Demo"
-- Archivo: 00000000000038_tienda_familiar_demo.sql

DO $$
DECLARE
    v_store_id UUID;
    v_owner_id UUID;
BEGIN
    SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
        -- 1. Insertar o recuperar comercio "Tienda Familiar Demo"
        INSERT INTO public.stores (
            name,
            category,
            city,
            owner_id,
            company_code,
            status,
            currency,
            timezone,
            contact_email
        ) VALUES (
            'Tienda Familiar Demo',
            'Ropa y Calzado',
            'Bogotá',
            v_owner_id,
            'TEK-99001',
            'active',
            'COP',
            'America/Bogota',
            'tienda.familiar@tekira.app'
        )
        ON CONFLICT DO NOTHING;

        SELECT id INTO v_store_id FROM public.stores WHERE name = 'Tienda Familiar Demo' LIMIT 1;

        IF v_store_id IS NOT NULL THEN
            -- 2. Asegurar suscripción Enterprise Piloto (90 días)
            INSERT INTO public.subscriptions (store_id, plan, status, started_at, expires_at)
            VALUES (v_store_id, 'enterprise', 'active', now(), now() + interval '90 days')
            ON CONFLICT DO NOTHING;

            -- 3. Cargar productos piloto con existencias en Tienda y Bodega
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
            ) VALUES 
            (v_store_id, 'Camisa Polo TEKIRA', 'CAMI0001', 65000.00, 65000.00, 33, 33, 'unidad', 10, 'available', '["Negra M (Tienda: 8)", "Blanca L (Bodega: 25)"]'::jsonb, 'Ropa', false),
            (v_store_id, 'Jean Clásico Denim', 'JEAN0002', 120000.00, 120000.00, 24, 24, 'unidad', 5, 'available', '["Azul Talla 32", "Negro Talla 34"]'::jsonb, 'Ropa', false),
            (v_store_id, 'Chaqueta Impermeable', 'CHAQ0003', 195000.00, 195000.00, 12, 12, 'unidad', 3, 'available', '["Verde L", "Negra XL"]'::jsonb, 'Ropa', false)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
