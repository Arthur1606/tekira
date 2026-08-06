-- Migración: Vinculación Automática de Miembros de Equipo por Email
-- Archivo: 00000000000012_auto_link_team_members.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Crear perfil de usuario
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        'owner'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Vincular automáticamente a registros pre-existentes en team_members por correo electrónico
    UPDATE public.team_members
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email) AND user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurar vinculación para usuarios ya registrados en auth.users
UPDATE public.team_members tm
SET user_id = u.id
FROM auth.users u
WHERE LOWER(tm.email) = LOWER(u.email) AND tm.user_id IS NULL;
