-- Migración: Fase 1.1 PRE-RELEASE v2.0 - Mejoras al Módulo Super Admin Platform Control
-- Archivo: 00000000000035_super_admin_v2_enhancements.sql

-- 1. Asegurar la columna is_super_admin en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Eliminar funciones previas para prevenir error 42P13 al cambiar tipo de retorno
DROP FUNCTION IF EXISTS public.get_super_admin_stores_v2();
DROP FUNCTION IF EXISTS public.get_super_admin_metrics_v2();
DROP FUNCTION IF EXISTS public.create_demo_store_rpc(TEXT, TEXT, TEXT, TEXT);

-- 3. Asegurar función is_super_admin_rpc
CREATE OR REPLACE FUNCTION public.is_super_admin_rpc(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND is_super_admin = true
    );
END;
$$;

-- 4. RPC SECURITY DEFINER mejorado para métricas agregadas globales
CREATE OR REPLACE FUNCTION public.get_super_admin_metrics_v2()
RETURNS TABLE (
    total_stores BIGINT,
    active_stores BIGINT,
    suspended_stores BIGINT,
    deleted_stores BIGINT,
    total_users BIGINT,
    total_products BIGINT,
    total_sales BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_super_admin_rpc(auth.uid()) THEN
        RAISE EXCEPTION 'Acceso denegado. Se requieren permisos de Super Admin.';
    END IF;

    -- Auditoría
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, metadata)
        VALUES (NULL, auth.uid(), 'SUPERADMIN_VIEW', 'superadmin_dashboard', '{"view": "metrics"}'::jsonb);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.stores WHERE status != 'deleted' OR status IS NULL) AS total_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'active' OR status IS NULL) AS active_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'suspended') AS suspended_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'deleted') AS deleted_stores,
        (SELECT COUNT(*) FROM auth.users) AS total_users,
        (SELECT COUNT(*) FROM public.products WHERE is_deleted = false OR is_deleted IS NULL) AS total_products,
        (SELECT COUNT(*) FROM public.sales) AS total_sales;
END;
$$;

-- 5. RPC SECURITY DEFINER a prueba de fallos para consultar TODOS los comercios
CREATE OR REPLACE FUNCTION public.get_super_admin_stores_v2()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    city TEXT,
    company_code TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    owner_email TEXT,
    owner_name TEXT,
    team_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_super_admin_rpc(auth.uid()) THEN
        RAISE EXCEPTION 'Acceso denegado. Se requieren permisos de Super Admin.';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        COALESCE(s.category, 'General') AS category,
        COALESCE(s.city, 'No especificada') AS city,
        COALESCE(s.company_code, 'TEK-00000') AS company_code,
        COALESCE(s.status, 'active') AS status,
        s.created_at,
        COALESCE(u.email, s.contact_email, 'propietario@demo.com') AS owner_email,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', s.name || ' Owner') AS owner_name,
        (SELECT COUNT(*) FROM public.team_members tm WHERE tm.store_id = s.id AND (tm.status = 'active' OR tm.status IS NULL)) AS team_count
    FROM public.stores s
    LEFT JOIN auth.users u ON u.id = s.owner_id
    LEFT JOIN public.profiles p ON p.id = s.owner_id
    ORDER BY s.created_at DESC;
END;
$$;

-- 6. RPC SECURITY DEFINER para crear rápidamente un comercio demo de prueba
CREATE OR REPLACE FUNCTION public.create_demo_store_rpc(
    p_name TEXT,
    p_category TEXT,
    p_city TEXT,
    p_owner_email TEXT DEFAULT NULL
)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store public.stores;
    v_user_id UUID;
    v_code TEXT;
    v_user_name TEXT;
BEGIN
    IF NOT public.is_super_admin_rpc(auth.uid()) THEN
        RAISE EXCEPTION 'Acceso denegado. Se requieren permisos de Super Admin.';
    END IF;

    v_user_id := auth.uid();
    
    -- Generar código único de empresa
    v_code := 'TEK-' || LPAD((FLOOR(RANDOM() * 89999) + 10000)::TEXT, 5, '0');
    WHILE EXISTS (SELECT 1 FROM public.stores WHERE company_code = v_code) LOOP
        v_code := 'TEK-' || LPAD((FLOOR(RANDOM() * 89999) + 10000)::TEXT, 5, '0');
    END LOOP;

    -- Insertar tienda demo activa
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
        TRIM(p_name),
        COALESCE(NULLIF(TRIM(p_category), ''), 'Tienda de barrio'),
        COALESCE(NULLIF(TRIM(p_city), ''), 'Bogotá'),
        v_user_id,
        v_code,
        'active',
        'COP',
        'America/Bogota',
        COALESCE(NULLIF(TRIM(p_owner_email), ''), 'demo@tekira.app')
    )
    RETURNING * INTO v_store;

    -- Obtener nombre de perfil
    SELECT COALESCE(full_name, 'Super Admin Propietario Demo') INTO v_user_name
    FROM public.profiles WHERE id = v_user_id;

    -- Agregar automáticamente al creador como 'owner' en team_members
    INSERT INTO public.team_members (
        store_id,
        user_id,
        name,
        email,
        role,
        employee_code,
        status
    ) VALUES (
        v_store.id,
        v_user_id,
        COALESCE(v_user_name, 'Propietario Demo'),
        COALESCE(NULLIF(TRIM(p_owner_email), ''), 'demo@tekira.app'),
        'owner',
        'TKR-EMP-000001',
        'active'
    )
    ON CONFLICT (store_id, user_id) DO NOTHING;

    -- Asignar plan piloto Enterprise 90 días por defecto
    INSERT INTO public.subscriptions (
        store_id,
        plan,
        status,
        started_at,
        expires_at
    ) VALUES (
        v_store.id,
        'enterprise',
        'active',
        now(),
        now() + interval '90 days'
    )
    ON CONFLICT (store_id) DO UPDATE
    SET plan = 'enterprise', status = 'active', expires_at = now() + interval '90 days';

    -- Registrar auditoría
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, entity_id, metadata)
        VALUES (v_store.id, v_user_id, 'DEMO_STORE_CREATED', 'stores', v_store.id::text, jsonb_build_object('name', p_name, 'company_code', v_code));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN v_store;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.is_super_admin_rpc(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_super_admin_metrics_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_super_admin_stores_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_demo_store_rpc(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
