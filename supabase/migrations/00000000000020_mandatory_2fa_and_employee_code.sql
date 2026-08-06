-- Migración: Fase 11.2B - 2FA Universal Obligatorio y Código Único de Empleado
-- Archivo: 00000000000020_mandatory_2fa_and_employee_code.sql

-- 1. Agregar columna employee_code a team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS employee_code TEXT;

-- 2. Función para generar código único de empleado por comercio
CREATE OR REPLACE FUNCTION public.generate_employee_code_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
    v_prefix TEXT;
    v_code TEXT;
BEGIN
    IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
        -- Contar miembros existentes en el comercio
        SELECT COUNT(*) INTO v_count
        FROM public.team_members
        WHERE store_id = NEW.store_id;

        v_prefix := 'EMP-';
        v_code := v_prefix || LPAD((v_count + 1)::TEXT, 4, '0');

        -- Asegurar unicidad por si acaso existe colisión
        WHILE EXISTS (SELECT 1 FROM public.team_members WHERE store_id = NEW.store_id AND employee_code = v_code) LOOP
            v_count := v_count + 1;
            v_code := v_prefix || LPAD((v_count + 1)::TEXT, 4, '0');
        END LOOP;

        NEW.employee_code := v_code;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Trigger para auto-asignar employee_code antes de insertar en team_members
DROP TRIGGER IF EXISTS trg_assign_employee_code ON public.team_members;
CREATE TRIGGER trg_assign_employee_code
BEFORE INSERT ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.generate_employee_code_func();

-- 4. Poblar employee_code para registros existentes en team_members
DO $$
DECLARE
    r RECORD;
    v_seq INT;
BEGIN
    FOR r IN (SELECT id, store_id FROM public.team_members WHERE employee_code IS NULL OR employee_code = '') LOOP
        SELECT COUNT(*) + 1 INTO v_seq FROM public.team_members WHERE store_id = r.store_id AND employee_code IS NOT NULL AND employee_code != '';
        UPDATE public.team_members
        SET employee_code = 'EMP-' || LPAD(v_seq::TEXT, 4, '0')
        WHERE id = r.id;
    END FOR;
END;
$$;

-- 5. Crear índice de unicidad por comercio para employee_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_store_emp_code ON public.team_members(store_id, employee_code);
