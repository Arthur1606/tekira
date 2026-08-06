-- Migración: Cierre de Caja y Sesiones de Transacciones
-- Archivo: 00000000000007_cash_closings.sql

-- 1. Modificar cash_openings para soportar sesiones (eliminar UNIQUE por date)
ALTER TABLE public.cash_openings
DROP CONSTRAINT IF EXISTS unique_store_date;

ALTER TABLE public.cash_openings
ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'));

-- Solo puede haber una caja abierta a la vez por comercio
CREATE UNIQUE INDEX idx_unique_open_cash_opening ON public.cash_openings(store_id) WHERE status = 'open';

-- 2. Modificar transactions para relacionarlas con una sesión de caja
ALTER TABLE public.transactions
ADD COLUMN cash_session_id UUID REFERENCES public.cash_openings(id) ON DELETE RESTRICT;

CREATE INDEX idx_transactions_cash_session_id ON public.transactions(cash_session_id);

-- 3. Crear tabla cash_closings (Preparación Arquitectónica)
CREATE TABLE public.cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opening_id UUID NOT NULL REFERENCES public.cash_openings(id) ON DELETE CASCADE UNIQUE,
    expected_amount NUMERIC(15,2) NOT NULL,
    counted_amount NUMERIC(15,2) NOT NULL,
    difference NUMERIC(15,2) NOT NULL,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Habilitar RLS en cash_closings
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de Seguridad (RLS) para cash_closings
CREATE POLICY "Users can view cash closings of their own stores"
ON public.cash_closings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.cash_openings
        JOIN public.stores ON stores.id = cash_openings.store_id
        WHERE cash_openings.id = cash_closings.opening_id
        AND stores.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert cash closings for their own stores"
ON public.cash_closings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cash_openings
        JOIN public.stores ON stores.id = cash_openings.store_id
        WHERE cash_openings.id = opening_id
        AND stores.owner_id = auth.uid()
    )
);
