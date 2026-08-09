-- Migración: Fase 9 PRE-RELEASE v2.9 - Corrección de Inventario, Estados de Venta (Pendiente/Entregado) y Validación de Stock
-- Archivo: 00000000000043_sale_statuses_and_stock_validation.sql

-- 1. Asegurar columna status en public.sales con valor por defecto 'pendiente'
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendiente';

-- Actualizar ventas existentes con status nulo o legacy
UPDATE public.sales SET status = 'pendiente' WHERE status IS NULL OR status = '' OR status = 'completed';

-- 2. Asegurar columnas de inventario sincronizadas en public.products
UPDATE public.products 
SET current_stock = quantity 
WHERE current_stock IS NULL AND quantity IS NOT NULL;

UPDATE public.products 
SET quantity = current_stock 
WHERE quantity IS NULL AND current_stock IS NOT NULL;

-- 3. Crear índice para filtrado rápido de ventas por estado
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(store_id, status);
