-- Migración: Fase 15.4 - Sistema Profesional de Invitaciones para Empleados
-- Archivo: 00000000000031_employee_invitations_system.sql

CREATE TABLE IF NOT EXISTS public.employee_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Owners and admins can view invitations" ON public.employee_invitations;
CREATE POLICY "Owners and admins can view invitations"
ON public.employee_invitations FOR SELECT
USING (
    public.is_store_member(store_id, ARRAY['owner', 'admin'])
    OR status = 'pending'
);

DROP POLICY IF EXISTS "Owners and admins can insert invitations" ON public.employee_invitations;
CREATE POLICY "Owners and admins can insert invitations"
ON public.employee_invitations FOR INSERT
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.employee_invitations;
CREATE POLICY "Owners and admins can update invitations"
ON public.employee_invitations FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']) OR status = 'pending');

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_employee_invitations_token ON public.employee_invitations(token);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_store_id ON public.employee_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_email ON public.employee_invitations(email);

-- RPC SECURITY DEFINER para consultar y validar invitaciones públicamente
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
    FROM public.employee_invitations i
    JOIN public.stores s ON s.id = i.store_id
    WHERE i.token = TRIM(p_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO service_role;
