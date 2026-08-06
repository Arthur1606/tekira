-- Migración: Fase 12.1 - Centro de Administración Empresarial TEKIRA
-- Archivo: 00000000000022_enterprise_admin_center.sql

-- 1. Agregar columna de permisos JSONB a team_members para arquitectura de permisos por módulo
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"sales": true, "inventory": true, "purchases": true, "reports": true, "users": true, "finance": true}'::jsonb;

-- 2. Asegurar que los registros existentes tengan permisos por defecto
UPDATE public.team_members
SET permissions = '{"sales": true, "inventory": true, "purchases": true, "reports": true, "users": true, "finance": true}'::jsonb
WHERE permissions IS NULL;
