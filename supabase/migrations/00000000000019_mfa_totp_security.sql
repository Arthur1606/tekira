-- Migración: Fase 11.2 - Autenticación Multifactor 2FA TOTP y Recuperación por Administración
-- Archivo: 00000000000019_mfa_totp_security.sql

-- 1. Tabla: user_mfa_settings (Configuración 2FA TOTP por usuario)
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    enabled_at TIMESTAMPTZ,
    backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Habilitar RLS en user_mfa_settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_mfa_settings: Cada usuario gestiona su propia configuración
DROP POLICY IF EXISTS "Users can view own mfa settings" ON public.user_mfa_settings;
CREATE POLICY "Users can view own mfa settings"
ON public.user_mfa_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mfa settings" ON public.user_mfa_settings;
CREATE POLICY "Users can insert own mfa settings"
ON public.user_mfa_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mfa settings" ON public.user_mfa_settings;
CREATE POLICY "Users can update own mfa settings"
ON public.user_mfa_settings FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mfa settings" ON public.user_mfa_settings;
CREATE POLICY "Users can delete own mfa settings"
ON public.user_mfa_settings FOR DELETE
USING (auth.uid() = user_id);

-- 2. Tabla: mfa_reset_requests (Solicitudes de recuperación de 2FA por pérdida de dispositivo)
CREATE TABLE IF NOT EXISTS public.mfa_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

-- Habilitar RLS en mfa_reset_requests
ALTER TABLE public.mfa_reset_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mfa_reset_requests
DROP POLICY IF EXISTS "Users can view own mfa reset requests" ON public.mfa_reset_requests;
CREATE POLICY "Users can view own mfa reset requests"
ON public.mfa_reset_requests FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_store_member(store_id, ARRAY['owner', 'admin'])
);

DROP POLICY IF EXISTS "Users can insert mfa reset requests" ON public.mfa_reset_requests;
CREATE POLICY "Users can insert mfa reset requests"
ON public.mfa_reset_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners and admins can update mfa reset requests" ON public.mfa_reset_requests;
CREATE POLICY "Owners and admins can update mfa reset requests"
ON public.mfa_reset_requests FOR UPDATE
USING (public.is_store_member(store_id, ARRAY['owner', 'admin']))
WITH CHECK (public.is_store_member(store_id, ARRAY['owner', 'admin']));

-- 3. Índices de Rendimiento y Seguridad
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON public.user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_reset_requests_store_id ON public.mfa_reset_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_mfa_reset_requests_status ON public.mfa_reset_requests(status);
