-- Migración: Fase 11.2 - Control Empresarial de Usuarios e Identidad TEKIRA
-- Archivo: 00000000000021_enterprise_identity_and_roles.sql

-- 1. Asegurar columnas en team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Actualizar función de generación de código único con formato TKR-EMP-000001
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
    IF NEW.employee_code IS NULL OR NEW.employee_code = '' OR NEW.employee_code NOT LIKE 'TKR-EMP-%' THEN
        -- Contar miembros existentes en el comercio
        SELECT COUNT(*) INTO v_count
        FROM public.team_members
        WHERE store_id = NEW.store_id;

        v_prefix := 'TKR-EMP-';
        v_code := v_prefix || LPAD((v_count + 1)::TEXT, 6, '0');

        -- Garantizar unicidad
        WHILE EXISTS (SELECT 1 FROM public.team_members WHERE store_id = NEW.store_id AND employee_code = v_code) LOOP
            v_count := v_count + 1;
            v_code := v_prefix || LPAD((v_count + 1)::TEXT, 6, '0');
        END LOOP;

        NEW.employee_code := v_code;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Asegurar Trigger activo
DROP TRIGGER IF EXISTS trg_assign_employee_code ON public.team_members;
CREATE TRIGGER trg_assign_employee_code
BEFORE INSERT ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.generate_employee_code_func();

-- 4. Actualizar registros existentes con el nuevo formato TKR-EMP-000001
DO $$
DECLARE
    r RECORD;
    v_seq INT;
BEGIN
    FOR r IN 
        SELECT id, store_id 
        FROM public.team_members 
        WHERE employee_code IS NULL OR employee_code = '' OR employee_code NOT LIKE 'TKR-EMP-%'
    LOOP
        SELECT COUNT(*) + 1 INTO v_seq 
        FROM public.team_members 
        WHERE store_id = r.store_id AND employee_code LIKE 'TKR-EMP-%';

        UPDATE public.team_members
        SET employee_code = 'TKR-EMP-' || LPAD(v_seq::TEXT, 6, '0')
        WHERE id = r.id;
    END LOOP;
END $$;

-- 5. Asegurar índice de unicidad
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_store_emp_code ON public.team_members(store_id, employee_code);
