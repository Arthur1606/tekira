-- Migración: Control de Caja Real (Aperturas de Caja)
-- Archivo: 00000000000006_cash_openings.sql

-- 1. Crear tabla cash_openings
CREATE TABLE public.cash_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    CONSTRAINT unique_store_date UNIQUE (store_id, date)
);

-- 2. Habilitar RLS
ALTER TABLE public.cash_openings ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad (RLS)
CREATE POLICY "Users can view cash openings of their own stores"
ON public.cash_openings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = cash_openings.store_id
        AND stores.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert cash openings for their own stores"
ON public.cash_openings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- 4. Crear Índices
CREATE INDEX idx_cash_openings_store_id ON public.cash_openings(store_id);
CREATE INDEX idx_cash_openings_date ON public.cash_openings(date);
