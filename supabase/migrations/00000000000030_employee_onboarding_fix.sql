-- Migración: Fase 15.3 - Vinculación de Empleados SECURITY DEFINER y Generador de Código de Empleado
-- Archivo: 00000000000030_employee_onboarding_fix.sql

-- 1. Función RPC SECURITY DEFINER para consultar comercios del usuario (Propietario o Empleado)
-- Bypass RLS de forma segura para vincular el user_id por correo en team_members
CREATE OR REPLACE FUNCTION public.get_user_stores_rpc(p_user_id UUID, p_email TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_id UUID,
    category TEXT,
    city TEXT,
    company_code TEXT,
    status TEXT,
    logo_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    currency TEXT,
    timezone TEXT,
    created_at TIMESTAMPTZ,
    user_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_email TEXT;
BEGIN
    v_clean_email := LOWER(TRIM(p_email));

    -- 1. Vincular proactivamente cualquier registro en team_members sin user_id que coincida por correo
    IF v_clean_email IS NOT NULL AND v_clean_email != '' THEN
        UPDATE public.team_members
        SET user_id = p_user_id,
            status = 'active'
        WHERE LOWER(TRIM(email)) = v_clean_email
          AND (user_id IS NULL OR user_id = p_user_id);
    END IF;

    -- 2. Retornar comercios donde el usuario es el Propietario (owner_id) o Miembro activo (team_members)
    RETURN QUERY
    SELECT DISTINCT
        s.id,
        s.name,
        s.owner_id,
        s.category,
        s.city,
        s.company_code,
        s.status,
        s.logo_url,
        s.contact_phone,
        s.contact_email,
        s.currency,
        s.timezone,
        s.created_at,
        CASE 
            WHEN s.owner_id = p_user_id THEN 'owner'
            ELSE COALESCE(tm.role, 'employee')
        END AS user_role
    FROM public.stores s
    LEFT JOIN public.team_members tm ON tm.store_id = s.id
    WHERE s.status = 'active'
      AND (
          s.owner_id = p_user_id
          OR (tm.user_id = p_user_id AND tm.status = 'active')
          OR (LOWER(TRIM(tm.email)) = v_clean_email AND tm.status = 'active')
      )
    ORDER BY s.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stores_rpc(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stores_rpc(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_stores_rpc(UUID, TEXT) TO anon;

-- 2. Formato de Código de Empleado TKR-EMP-000001
CREATE OR REPLACE FUNCTION public.generate_employee_code_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
    v_code TEXT;
BEGIN
    IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.team_members
        WHERE store_id = NEW.store_id;

        v_code := 'TKR-EMP-' || LPAD((v_count + 1)::TEXT, 6, '0');

        WHILE EXISTS (SELECT 1 FROM public.team_members WHERE store_id = NEW.store_id AND employee_code = v_code) LOOP
            v_count := v_count + 1;
            v_code := 'TKR-EMP-' || LPAD((v_count + 1)::TEXT, 6, '0');
        END LOOP;

        NEW.employee_code := v_code;
    END IF;

    RETURN NEW;
END;
$$;
