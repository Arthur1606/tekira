-- Migración: Sincronización de Propietarios (Owners) Existentes
-- Archivo: 00000000000003_sync_owners.sql
-- Objetivo: Asegurar que todos los comercios creados antes de la Fase 6 tengan a su propietario registrado en team_members.

INSERT INTO public.team_members (store_id, user_id, name, email, role, status)
SELECT 
    s.id as store_id,
    s.owner_id as user_id,
    COALESCE(p.name, 'Propietario') as name,
    u.email as email,
    'owner' as role,
    'active' as status
FROM public.stores s
LEFT JOIN public.profiles p ON p.id = s.owner_id
LEFT JOIN auth.users u ON u.id = s.owner_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.store_id = s.id AND tm.role = 'owner'
);
