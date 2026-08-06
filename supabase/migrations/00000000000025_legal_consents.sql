-- Migración: Fase 13 - Consentimiento Legal y Términos v0.12.0
-- Archivo: 00000000000025_legal_consents.sql

CREATE TABLE IF NOT EXISTS public.legal_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    privacy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    terms_version VARCHAR(20) NOT NULL DEFAULT 'v0.12.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Isolation
ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_consents_select ON public.legal_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY legal_consents_insert ON public.legal_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
