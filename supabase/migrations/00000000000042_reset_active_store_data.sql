-- Migración: Limpieza de Datos Operativos para Inicializar Comercio como Nuevo
-- Archivo: 00000000000042_reset_active_store_data.sql

DO $$
BEGIN
    -- 1. Eliminar movimientos de auditoría y ventas
    TRUNCATE TABLE public.sale_audit_logs CASCADE;
    TRUNCATE TABLE public.sale_items CASCADE;
    TRUNCATE TABLE public.sales CASCADE;

    -- 2. Eliminar movimientos de inventario y productos
    TRUNCATE TABLE public.inventory_movements CASCADE;
    TRUNCATE TABLE public.product_variants CASCADE;
    TRUNCATE TABLE public.products CASCADE;

    -- 3. Eliminar operaciones de caja y transacciones financieras
    TRUNCATE TABLE public.transactions CASCADE;
    TRUNCATE TABLE public.cash_closings CASCADE;
    TRUNCATE TABLE public.cash_openings CASCADE;

    -- 4. Eliminar registros de compras, proveedores y clientes
    TRUNCATE TABLE public.purchases CASCADE;
    TRUNCATE TABLE public.suppliers CASCADE;
    TRUNCATE TABLE public.customers CASCADE;

    -- 5. Limpiar registros de auditoría de seguridad
    TRUNCATE TABLE public.security_logs CASCADE;

    RAISE NOTICE 'Todos los datos operativos del comercio fueron reiniciados correctamente.';
EXCEPTION WHEN OTHERS THEN
    -- Fallback si TRUNCATE falla por llaves foráneas o permisos RLS
    DELETE FROM public.sale_audit_logs;
    DELETE FROM public.sale_items;
    DELETE FROM public.sales;
    DELETE FROM public.inventory_movements;
    DELETE FROM public.product_variants;
    DELETE FROM public.products;
    DELETE FROM public.transactions;
    DELETE FROM public.cash_closings;
    DELETE FROM public.cash_openings;
    DELETE FROM public.purchases;
    DELETE FROM public.suppliers;
    DELETE FROM public.customers;
    DELETE FROM public.security_logs;
END $$;
