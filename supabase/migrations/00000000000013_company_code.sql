-- Migración: Código Único de Empresa y Registro de Usuarios por Código
-- Archivo: 00000000000013_company_code.sql

-- 1. Agregar columna company_code a la tabla stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS company_code TEXT UNIQUE;

-- 2. Función para generar un código único de empresa (ej. MAR-48291, TEK-83921)
CREATE OR REPLACE FUNCTION public.generate_company_code(store_name TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_prefix TEXT;
    random_num INT;
    candidate_code TEXT;
    exists_count INT;
BEGIN
    -- Limpiar nombre para obtener 3 letras principales o 'TEK' por defecto
    clean_prefix := UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE(store_name, 'TEKIRA'), '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3));
    IF LENGTH(clean_prefix) < 3 THEN
        clean_prefix := 'TEK';
    END IF;

    LOOP
        -- Generar número aleatorio de 5 dígitos (10000 a 99999)
        random_num := FLOOR(10000 + RANDOM() * 90000)::INT;
        candidate_code := clean_prefix || '-' || random_num::TEXT;

        -- Verificar unicidad en la tabla stores
        SELECT COUNT(*) INTO exists_count FROM public.stores WHERE company_code = candidate_code;
        IF exists_count = 0 THEN
            RETURN candidate_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Trigger BEFORE INSERT para auto-generar company_code si es nulo
CREATE OR REPLACE FUNCTION public.set_store_company_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_code IS NULL OR TRIM(NEW.company_code) = '' THEN
        NEW.company_code := public.generate_company_code(NEW.name);
    ELSE
        NEW.company_code := UPPER(TRIM(NEW.company_code));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_store_company_code ON public.stores;
CREATE TRIGGER trigger_set_store_company_code
    BEFORE INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.set_store_company_code();

-- 4. Actualizar comercios existentes que no tengan código
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, name FROM public.stores WHERE company_code IS NULL LOOP
        UPDATE public.stores
        SET company_code = public.generate_company_code(r.name)
        WHERE id = r.id;
    END LOOP;
END $$;

-- 5. Crear índice para búsqueda ultra-rápida por código de empresa
CREATE INDEX IF NOT EXISTS idx_stores_company_code ON public.stores(company_code);
