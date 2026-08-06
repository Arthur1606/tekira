-- Migración: Fase 14.4 - Modelo SaaS Comercial y Suscripciones
-- Archivo: 00000000000026_saas_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    plan_tier VARCHAR(20) NOT NULL DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
    status VARCHAR(20) NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired', 'suspended'
    trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
    max_users INT NOT NULL DEFAULT 3,
    max_locations INT NOT NULL DEFAULT 1,
    max_products INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios de un comercio pueden ver la suscripción de su empresa
CREATE POLICY subscriptions_select ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = subscriptions.store_id
            AND s.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.store_id = subscriptions.store_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
        )
    );

-- Política RLS: Solo los owners pueden modificar la suscripción
CREATE POLICY subscriptions_all_owner ON public.subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = subscriptions.store_id
            AND s.owner_id = auth.uid()
        )
    );

-- Trigger para inicializar suscripción automática en 'trial' al crear una tienda
CREATE OR REPLACE FUNCTION public.fn_initialize_store_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (
        store_id,
        plan_tier,
        status,
        trial_ends_at,
        current_period_end,
        max_users,
        max_locations,
        max_products
    ) VALUES (
        NEW.id,
        'basic',
        'trial',
        now() + interval '14 days',
        now() + interval '14 days',
        3,  -- Límite plan Básico: 3 usuarios
        1,  -- Límite plan Básico: 1 ubicación/bodega
        50  -- Límite plan Básico: 50 productos
    ) ON CONFLICT (store_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_initialize_store_subscription ON public.stores;
CREATE TRIGGER trg_initialize_store_subscription
    AFTER INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_initialize_store_subscription();

-- Inicializar suscripción para tiendas existentes que aún no tengan registro
INSERT INTO public.subscriptions (store_id, plan_tier, status, trial_ends_at, current_period_end, max_users, max_locations, max_products)
SELECT id, 'basic', 'trial', now() + interval '14 days', now() + interval '14 days', 3, 1, 50
FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

-- Función RPC para Super Admin Metrics agregadas globales (Sin datos privados)
CREATE OR REPLACE FUNCTION public.get_saas_super_admin_metrics()
RETURNS TABLE (
    total_stores BIGINT,
    active_stores BIGINT,
    trial_stores BIGINT,
    total_users BIGINT,
    basic_plan_stores BIGINT,
    professional_plan_stores BIGINT,
    enterprise_plan_stores BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.stores) AS total_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'active') AS active_stores,
        (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trial') AS trial_stores,
        (SELECT COUNT(*) FROM auth.users) AS total_users,
        (SELECT COUNT(*) FROM public.subscriptions WHERE plan_tier = 'basic') AS basic_plan_stores,
        (SELECT COUNT(*) FROM public.subscriptions WHERE plan_tier = 'professional') AS professional_plan_stores,
        (SELECT COUNT(*) FROM public.subscriptions WHERE plan_tier = 'enterprise') AS enterprise_plan_stores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
