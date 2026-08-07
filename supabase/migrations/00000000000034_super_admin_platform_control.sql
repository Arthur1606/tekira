-- Migración: Fase 1 PRE-RELEASE v2.0 - Módulo de Control de Plataforma Super Admin
-- Archivo: 00000000000034_super_admin_platform_control.sql

-- 1. Agregar columna is_super_admin a profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Agregar columnas de borrado lógico a stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Función auxiliar RPC SECURITY DEFINER para verificar rol Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin_rpc(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_user_id AND is_super_admin = true
    );
END;
$$;

-- 4. RPC SECURITY DEFINER para obtener métricas globales de la plataforma (Sin datos operativos privados)
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

    -- Registrar auditoría en security_logs
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, metadata)
        VALUES (NULL, auth.uid(), 'SUPERADMIN_VIEW', 'superadmin_dashboard', '{"view": "metrics"}'::jsonb);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.stores WHERE status != 'deleted' OR status IS NULL) AS total_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'active') AS active_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'suspended') AS suspended_stores,
        (SELECT COUNT(*) FROM public.stores WHERE status = 'deleted') AS deleted_stores,
        (SELECT COUNT(*) FROM auth.users) AS total_users,
        (SELECT COUNT(*) FROM public.products WHERE is_deleted = false OR is_deleted IS NULL) AS total_products,
        (SELECT COUNT(*) FROM public.sales) AS total_sales;
END;
$$;

-- 5. RPC SECURITY DEFINER para listar comercios y su metadata básica
CREATE OR REPLACE FUNCTION public.get_super_admin_stores_v2()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    city TEXT,
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
        s.category,
        s.city,
        s.status,
        s.created_at,
        u.email AS owner_email,
        COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', u.email) AS owner_name,
        (SELECT COUNT(*) FROM public.team_members tm WHERE tm.store_id = s.id AND tm.status = 'active') AS team_count
    FROM public.stores s
    LEFT JOIN auth.users u ON u.id = s.owner_id
    LEFT JOIN public.profiles p ON p.id = s.owner_id
    ORDER BY s.created_at DESC;
END;
$$;

-- 6. RPC SECURITY DEFINER para suspender, reactivar o borrar lógicamente comercios
CREATE OR REPLACE FUNCTION public.toggle_store_status_rpc(p_store_id UUID, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_action_log TEXT;
BEGIN
    IF NOT public.is_super_admin_rpc(auth.uid()) THEN
        RAISE EXCEPTION 'Acceso denegado. Se requieren permisos de Super Admin.';
    END IF;

    IF p_action = 'suspend' THEN
        UPDATE public.stores SET status = 'suspended' WHERE id = p_store_id;
        v_action_log := 'STORE_SUSPENDED';
    ELSIF p_action = 'reactivate' THEN
        UPDATE public.stores SET status = 'active' WHERE id = p_store_id;
        v_action_log := 'STORE_REACTIVATED';
    ELSIF p_action = 'delete' THEN
        UPDATE public.stores 
        SET status = 'deleted',
            deleted_at = now(),
            deleted_by = auth.uid()
        WHERE id = p_store_id;
        v_action_log := 'STORE_DELETED';
    ELSE
        RAISE EXCEPTION 'Acción de superadmin no válida.';
    END IF;

    -- Registrar log inmutable de auditoría
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, entity_id, metadata)
        VALUES (p_store_id, auth.uid(), v_action_log, 'stores', p_store_id::text, jsonb_build_object('action', p_action));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN TRUE;
END;
$$;

-- Otorgar permisos globales a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_super_admin_rpc(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_super_admin_metrics_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_super_admin_stores_v2() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.toggle_store_status_rpc(UUID, TEXT) TO authenticated, service_role;
