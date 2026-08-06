-- Migración: Fase 15.2 - Autenticación 2FA Individual por Usuario (Fix TOTP Mismatch)
-- Archivo: 00000000000029_individual_user_mfa.sql

-- 1. Asegurar tabla user_mfa_settings con restricciones de 1 Usuario = 1 Secreto Único
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    enabled_at TIMESTAMPTZ,
    backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Asegurar restricción UNIQUE en secret si la tabla ya existía previamente
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_mfa_settings_secret_key'
    ) THEN
        BEGIN
            ALTER TABLE public.user_mfa_settings ADD CONSTRAINT user_mfa_settings_secret_key UNIQUE (secret);
        EXCEPTION
            WHEN OTHERS THEN NULL;
        END;
    END IF;
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- 3. Asegurar políticas RLS
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
