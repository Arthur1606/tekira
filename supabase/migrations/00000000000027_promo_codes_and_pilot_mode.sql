-- Migración: Fase 14.4 - Promo Codes & Pilot Mode
-- Archivo: 00000000000027_promo_codes_and_pilot_mode.sql

CREATE TABLE IF NOT EXISTS public.promotion_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    plan_assigned VARCHAR(20) NOT NULL DEFAULT 'enterprise',
    duration_days INT NOT NULL DEFAULT 90,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
    CONSTRAINT uq_promotion_store_code UNIQUE (store_id, code)
);

-- Habilitar RLS
ALTER TABLE public.promotion_code_usage ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY promo_usage_owner_select ON public.promotion_code_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = promotion_code_usage.store_id
            AND s.owner_id = auth.uid()
        )
    );

CREATE POLICY promo_usage_owner_insert ON public.promotion_code_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = promotion_code_usage.store_id
            AND s.owner_id = auth.uid()
        )
    );

-- Función RPC Segura para canjear cupón promocional (Código Maestro: TEKIRA-PILOTO-90)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_store_id UUID, p_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    -- Validar que el usuario sea el Owner de la tienda
    IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND owner_id = v_user_id) THEN
        RAISE EXCEPTION 'Acceso denegado. Solo el propietario puede canjear códigos promocionales.';
    END IF;

    -- Validar código maestro
    IF UPPER(p_code) != 'TEKIRA-PILOTO-90' THEN
        RAISE EXCEPTION 'El código promocional es inválido o no existe.';
    END IF;

    -- Verificar si ya fue canjeado en esta tienda
    SELECT EXISTS (
        SELECT 1 FROM public.promotion_code_usage
        WHERE store_id = p_store_id AND UPPER(code) = UPPER(p_code)
    ) INTO v_exists;

    IF v_exists THEN
        RAISE EXCEPTION 'Este código promocional ya fue aplicado y activado en este comercio.';
    END IF;

    -- 1. Registrar uso de cupón
    INSERT INTO public.promotion_code_usage (store_id, user_id, code, plan_assigned, duration_days, expires_at)
    VALUES (p_store_id, v_user_id, UPPER(p_code), 'enterprise', 90, now() + interval '90 days');

    -- 2. Actualizar suscripción a Enterprise y 90 días de Trial (Piloto Universal)
    UPDATE public.subscriptions
    SET plan_tier = 'enterprise',
        status = 'trial',
        trial_ends_at = now() + interval '90 days',
        current_period_end = now() + interval '90 days',
        max_users = 9999,
        max_locations = 9999,
        max_products = 9999,
        updated_at = now()
    WHERE store_id = p_store_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
