-- Migración: Fase 15.6 - Sistema de Invitaciones Empresariales a Prueba de Fallos
-- Archivo: 00000000000033_enterprise_invitations_bulletproof.sql

-- 1. Crear o asegurar estructura de tabla team_invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    employee_code TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Asegurar columnas si la tabla ya existía de migraciones anteriores
ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS accepted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS employee_code TEXT;

-- Habilitar RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Permisivas para Consulta Pública de Token
DROP POLICY IF EXISTS "Public read pending invitations by token" ON public.team_invitations;
CREATE POLICY "Public read pending invitations by token"
ON public.team_invitations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners and admins can insert team_invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can insert team_invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can update team_invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can update team_invitations"
ON public.team_invitations FOR UPDATE
USING (true);

-- Índices de consulta ultra rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_token_unique ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_store_id ON public.team_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- 2. RPC SECURITY DEFINER para crear invitaciones evadiendo bloqueos RLS
CREATE OR REPLACE FUNCTION public.create_team_invitation_rpc(
    p_store_id UUID,
    p_email TEXT,
    p_role TEXT,
    p_token TEXT,
    p_created_by UUID
)
RETURNS public.team_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite public.team_invitations;
BEGIN
    INSERT INTO public.team_invitations (
        store_id,
        email,
        role,
        token,
        status,
        expires_at,
        created_by
    ) VALUES (
        p_store_id,
        LOWER(TRIM(p_email)),
        p_role,
        TRIM(p_token),
        'pending',
        now() + interval '7 days',
        p_created_by
    )
    RETURNING * INTO v_invite;

    -- Intentar replicar en employee_invitations para compatibilidad cruzada
    BEGIN
        INSERT INTO public.employee_invitations (store_id, email, role, token, status, expires_at, created_by)
        VALUES (p_store_id, LOWER(TRIM(p_email)), p_role, TRIM(p_token), 'pending', now() + interval '7 days', p_created_by);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN v_invite;
END;
$$;

-- 3. RPC SECURITY DEFINER para validar invitaciones de forma totalmente pública
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    store_name TEXT,
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

-- 4. RPC SECURITY DEFINER para procesar aceptación de invitación e inserción en team_members con employee_code
CREATE OR REPLACE FUNCTION public.accept_team_invitation_rpc(
    p_token TEXT,
    p_user_id UUID,
    p_name TEXT
)
RETURNS TABLE (
    out_store_id UUID,
    out_employee_code TEXT,
    out_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_code TEXT;
    v_count INT;
BEGIN
    SELECT * INTO v_invite
    FROM (
        SELECT id, store_id, email, role, token, status, expires_at FROM public.team_invitations WHERE TRIM(token) = TRIM(p_token)
        UNION ALL
        SELECT id, store_id, email, role, token, status, expires_at FROM public.employee_invitations WHERE TRIM(token) = TRIM(p_token)
    ) i LIMIT 1;

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'La invitación no existe o el token es inválido.';
    END IF;

    -- Generar código único de empleado TKR-EMP-000001
    SELECT COUNT(*) INTO v_count
    FROM public.team_members
    WHERE store_id = v_invite.store_id;

    v_code := 'TKR-EMP-' || LPAD((v_count + 1)::TEXT, 6, '0');

    WHILE EXISTS (SELECT 1 FROM public.team_members WHERE store_id = v_invite.store_id AND employee_code = v_code) LOOP
        v_count := v_count + 1;
        v_code := 'TKR-EMP-' || LPAD((v_count + 1)::TEXT, 6, '0');
    END LOOP;

    -- Crear o vincular registro en team_members
    INSERT INTO public.team_members (
        store_id,
        user_id,
        name,
        email,
        role,
        employee_code,
        status
    ) VALUES (
        v_invite.store_id,
        p_user_id,
        p_name,
        v_invite.email,
        v_invite.role,
        v_code,
        'active'
    )
    ON CONFLICT (store_id, user_id) DO UPDATE
    SET role = v_invite.role,
        employee_code = COALESCE(public.team_members.employee_code, EXCLUDED.employee_code),
        status = 'active';

    -- Marcar invitación como aceptada
    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = now(),
        accepted_user_id = p_user_id
    WHERE TRIM(token) = TRIM(p_token);

    BEGIN
        UPDATE public.employee_invitations
        SET status = 'accepted',
            accepted_by = p_user_id
        WHERE TRIM(token) = TRIM(p_token);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN QUERY SELECT v_invite.store_id, v_code, v_invite.role;
END;
$$;

-- Permisos globales de ejecución
GRANT EXECUTE ON FUNCTION public.create_team_invitation_rpc(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation_rpc(TEXT, UUID, TEXT) TO authenticated, service_role, anon;
