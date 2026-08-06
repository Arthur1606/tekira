-- Migración: Vinculación Inmediata de Membresías para Usuarios que se Unen por Código
-- Archivo: 00000000000015_fix_team_member_linking.sql

-- 1. Asegurar que la función handle_new_user vincule team_members inmediatamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear o asegurar perfil de usuario
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        'employee'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Vincular automáticamente registros de team_members existentes por correo electrónico
    UPDATE public.team_members
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email) AND (user_id IS NULL OR user_id != NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-aplicar vinculación para usuarios actuales en auth.users
UPDATE public.team_members tm
SET user_id = u.id
FROM auth.users u
WHERE LOWER(tm.email) = LOWER(u.email) AND (tm.user_id IS NULL OR tm.user_id != u.id);
