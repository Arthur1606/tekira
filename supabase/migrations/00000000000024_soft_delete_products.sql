-- Migración: Fase 12.3 - Soft Delete de Productos y Auditoría
-- Archivo: 00000000000024_soft_delete_products.sql

-- 1. Agregar columnas para Soft Delete en la tabla products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- 2. Índice para acelerar filtros de productos no eliminados
CREATE INDEX IF NOT EXISTS idx_products_store_deleted_at ON public.products(store_id, deleted_at);
