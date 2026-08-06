-- Migración: Fase 11.1 - Arquitectura Multiempresa y Aislamiento RLS
-- Archivo: 00000000000018_saas_multi_tenant_security.sql

-- 1. Extensión de la tabla stores con atributos de organización SaaS
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'COP',
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Bogota';

-- 2. Asegurar que comercios existentes tengan status 'active'
UPDATE public.stores
SET status = 'active'
WHERE status IS NULL;

-- 3. Actualizar la función RLS is_store_member para validar el estado activo del comercio
CREATE OR REPLACE FUNCTION public.is_store_member(
    p_store_id UUID,
    p_allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'employee']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_store_status TEXT;
    v_is_owner BOOLEAN;
    v_is_member BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL OR p_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar el estado de la empresa
    SELECT status INTO v_store_status
    FROM public.stores
    WHERE id = p_store_id;

    -- Si la empresa está suspendida o bloqueada, rechazar acceso operativo inmediatamente
    IF v_store_status IS NULL OR v_store_status != 'active' THEN
        RETURN FALSE;
    END IF;

    -- Verificar si es el dueño directo registrado en stores
    SELECT EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = p_store_id AND owner_id = v_user_id AND status = 'active'
    ) INTO v_is_owner;

    IF v_is_owner AND ('owner' = ANY(p_allowed_roles)) THEN
        RETURN TRUE;
    END IF;

    -- Verificar si es un miembro activo registrado en team_members con rol permitido
    SELECT EXISTS (
        SELECT 1 FROM public.team_members
        WHERE store_id = p_store_id
          AND user_id = v_user_id
          AND status = 'active'
          AND role = ANY(p_allowed_roles)
    ) INTO v_is_member;

    RETURN v_is_member;
END;
$$;

-- 4. Crear índice para optimizar consultas por estado de comercio
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
