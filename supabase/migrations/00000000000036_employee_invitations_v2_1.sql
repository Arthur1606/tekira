-- Migración: Fase 2 PRE-RELEASE v2.1 - Sistema de Invitaciones y Gestión de Empleados
-- Archivo: 00000000000036_employee_invitations_v2_1.sql

-- 1. Eliminar funciones previas para evitar error 42P13 al agregar logo_url
DROP FUNCTION IF EXISTS public.get_invitation_by_token(TEXT);
DROP FUNCTION IF EXISTS public.cancel_invitation_rpc(UUID);
DROP FUNCTION IF EXISTS public.regenerate_invitation_rpc(UUID);

-- 2. RPC SECURITY DEFINER mejorado para validar invitaciones públicamente e incluir logo_url
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    store_name TEXT,
    logo_url TEXT,
    company_code TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_token TEXT;
BEGIN
    v_clean_token := TRIM(p_token);

    RETURN QUERY
    SELECT 
        i.id,
        i.store_id,
        s.name AS store_name,
        s.logo_url AS logo_url,
        s.company_code,
        i.email,
        i.role,
        i.status,
        i.expires_at,
        (i.status = 'pending' AND i.expires_at > now()) AS is_valid
    FROM (
        SELECT id, store_id, email, role, token, status, expires_at FROM public.team_invitations WHERE TRIM(token) = v_clean_token
        UNION ALL
        SELECT id, store_id, email, role, token, status, expires_at FROM public.employee_invitations WHERE TRIM(token) = v_clean_token
    ) i
    JOIN public.stores s ON s.id = i.store_id
    LIMIT 1;
END;
$$;

-- 3. RPC SECURITY DEFINER para cancelar invitaciones pendientes
CREATE OR REPLACE FUNCTION public.cancel_invitation_rpc(p_invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
    v_email TEXT;
BEGIN
    SELECT store_id, email INTO v_store_id, v_email
    FROM public.team_invitations WHERE id = p_invitation_id;

    IF v_store_id IS NULL THEN
        SELECT store_id, email INTO v_store_id, v_email
        FROM public.employee_invitations WHERE id = p_invitation_id;
    END IF;

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'Invitación no encontrada.';
    END IF;

    UPDATE public.team_invitations SET status = 'cancelled' WHERE id = p_invitation_id;
    
    BEGIN
        UPDATE public.employee_invitations SET status = 'cancelled' WHERE id = p_invitation_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Auditoría
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, entity_id, metadata)
        VALUES (v_store_id, auth.uid(), 'INVITATION_CANCELLED', 'team_invitations', p_invitation_id::text, jsonb_build_object('email', v_email));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN TRUE;
END;
$$;

-- 4. RPC SECURITY DEFINER para regenerar una invitación (nueva vigencia de 7 días y nuevo token)
CREATE OR REPLACE FUNCTION public.regenerate_invitation_rpc(p_invitation_id UUID, p_new_token TEXT)
RETURNS public.team_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite public.team_invitations;
BEGIN
    UPDATE public.team_invitations
    SET token = TRIM(p_new_token),
        status = 'pending',
        expires_at = now() + interval '7 days'
    WHERE id = p_invitation_id
    RETURNING * INTO v_invite;

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'No se pudo regenerar la invitación.';
    END IF;

    -- Auditoría
    BEGIN
        INSERT INTO public.security_logs (store_id, user_id, action, entity, entity_id, metadata)
        VALUES (v_invite.store_id, auth.uid(), 'INVITATION_REGENERATED', 'team_invitations', p_invitation_id::text, jsonb_build_object('email', v_invite.email, 'new_token', p_new_token));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    RETURN v_invite;
END;
$$;

-- 5. RPC SECURITY DEFINER para listar invitaciones de un comercio
CREATE OR REPLACE FUNCTION public.get_store_invitations_rpc(p_store_id UUID)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    email TEXT,
    role TEXT,
    token TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.store_id,
        i.email,
        i.role,
        i.token,
        i.status,
        i.created_at,
        i.expires_at
    FROM public.team_invitations i
    WHERE i.store_id = p_store_id
    ORDER BY i.created_at DESC;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_invitation_rpc(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.regenerate_invitation_rpc(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_store_invitations_rpc(UUID) TO authenticated, service_role;
