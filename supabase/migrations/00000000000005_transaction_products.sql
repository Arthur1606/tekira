-- Migración: Integración Transacciones e Inventario
-- Archivo: 00000000000005_transaction_products.sql

-- 1. Agregar columnas a transactions
ALTER TABLE public.transactions
ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN quantity NUMERIC(15,4);

-- 2. Índice para búsquedas rápidas por producto
CREATE INDEX idx_transactions_product_id ON public.transactions(product_id);
