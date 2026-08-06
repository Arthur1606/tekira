-- Migración: Tabla de Transacciones (Movimientos de Caja)
-- Archivo: 00000000000001_transactions.sql

-- 1. Crear tabla transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad (RLS)
-- Los usuarios solo pueden ver y modificar transacciones si son dueños del store asociado.

-- Select
CREATE POLICY "Users can view transactions of their own stores"
ON public.transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = transactions.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Insert
CREATE POLICY "Users can insert transactions for their own stores"
ON public.transactions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Update
CREATE POLICY "Users can update transactions of their own stores"
ON public.transactions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = transactions.store_id
        AND stores.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Delete
CREATE POLICY "Users can delete transactions of their own stores"
ON public.transactions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = transactions.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- 4. Crear Índices para optimización de reportes
CREATE INDEX idx_transactions_store_id ON public.transactions(store_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transactions_type ON public.transactions(type);
