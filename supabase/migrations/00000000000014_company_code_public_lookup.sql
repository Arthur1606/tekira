-- Migración: Búsqueda Pública Segura de Código de Empresa para Registro Multiusuario
-- Archivo: 00000000000014_company_code_public_lookup.sql

-- 1. Función RPC con SECURITY DEFINER para consultar un comercio mediante su company_code sin exponer datos sensibles.
-- Accesible para usuarios anónimos (anon) durante el proceso de registro.
CREATE OR REPLACE FUNCTION public.get_store_by_company_code(p_code TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    company_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.company_code
    FROM public.stores s
    WHERE UPPER(TRIM(s.company_code)) = UPPER(TRIM(p_code));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Otorgar permisos de ejecución explícitos a los roles anon y authenticated
GRANT EXECUTE ON FUNCTION public.get_store_by_company_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_store_by_company_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_by_company_code(TEXT) TO service_role;
