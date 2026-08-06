-- Migración: Registro de Integrante por Código vía SECURITY DEFINER (Bypass RLS para usuarios que se unen)
-- Archivo: 00000000000016_security_definer_join_by_code.sql

CREATE OR REPLACE FUNCTION public.register_team_member_by_code(
    p_company_code TEXT,
    p_user_id UUID,
    p_name TEXT,
    p_email TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    store_id UUID,
    store_name TEXT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
    v_store_name TEXT;
    v_existing_id UUID;
BEGIN
    -- 1. Normalizar código y buscar comercio activo
    SELECT id, name INTO v_store_id, v_store_name
    FROM public.stores
    WHERE UPPER(TRIM(company_code)) = UPPER(TRIM(p_company_code));

    IF v_store_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'El código de empresa no existe o no es válido.'::TEXT;
        RETURN;
    END IF;

    -- 2. Verificar si ya existe un registro previo por user_id o por correo electrónico
    SELECT id INTO v_existing_id
    FROM public.team_members
    WHERE store_id = v_store_id
      AND (user_id = p_user_id OR LOWER(email) = LOWER(p_email));

    IF v_existing_id IS NOT NULL THEN
        -- Actualizar vinculación y asegurar que user_id y status estén activos
        UPDATE public.team_members
        SET user_id = p_user_id,
            name = COALESCE(p_name, name),
            status = 'active'
        WHERE id = v_existing_id;

        RETURN QUERY SELECT TRUE, v_store_id, v_store_name, 'Membresía vinculada con éxito.'::TEXT;
        RETURN;
    END IF;

    -- 3. Insertar nuevo integrante en team_members con rol 'employee' y status 'active'
    INSERT INTO public.team_members (
        store_id,
        user_id,
        name,
        email,
        role,
        status
    ) VALUES (
        v_store_id,
        p_user_id,
        p_name,
        p_email,
        'employee',
        'active'
    );

    RETURN QUERY SELECT TRUE, v_store_id, v_store_name, 'Integrante registrado exitosamente en el equipo.'::TEXT;
END;
$$;

-- Otorgar permisos de ejecución explícitos a anon, authenticated y service_role
GRANT EXECUTE ON FUNCTION public.register_team_member_by_code(TEXT, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_team_member_by_code(TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_team_member_by_code(TEXT, UUID, TEXT, TEXT) TO service_role;
