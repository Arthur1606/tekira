-- Migración: Fase 15.5 - Sistema de Invitaciones Independiente sin Dependencia de Correos Supabase
-- Archivo: 00000000000032_team_invitations_alias.sql

-- 1. Tabla team_invitations con soporte completo para tokens y códigos asignados
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
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Owners and admins can view team_invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can view team_invitations"
ON public.team_invitations FOR SELECT
USING (
    public.is_store_member(store_id, ARRAY['owner', 'admin'])
    OR status = 'pending'
);

DROP POLICY IF EXISTS "Owners and admins can insert team_invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can insert team_invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Owners and admins can update team_invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins can update team_invitations"
ON public.team_invitations FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']) OR status = 'pending');

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_store_id ON public.team_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- RPC SECURITY DEFINER para consultar invitaciones por token en team_invitations o employee_invitations
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
BEGIN
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
        SELECT id, store_id, email, role, token, status, expires_at FROM public.team_invitations
        UNION ALL
        SELECT id, store_id, email, role, token, status, expires_at FROM public.employee_invitations
        WHERE token NOT IN (SELECT token FROM public.team_invitations)
    ) i
    JOIN public.stores s ON s.id = i.store_id
    WHERE i.token = TRIM(p_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO service_role;
