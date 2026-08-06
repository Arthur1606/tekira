-- Migración: Tabla de Equipo (Team Members)
-- Archivo: 00000000000002_team.sql

-- 1. Crear tabla team_members
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional, para login futuro
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'employee')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad (RLS)
-- Los usuarios solo pueden ver y modificar empleados si son dueños del store asociado.

-- Select
CREATE POLICY "Users can view team members of their own stores"
ON public.team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = team_members.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Insert
CREATE POLICY "Users can insert team members for their own stores"
ON public.team_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Update
CREATE POLICY "Users can update team members of their own stores"
ON public.team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = team_members.store_id
        AND stores.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
);

-- Delete
CREATE POLICY "Users can delete team members of their own stores"
ON public.team_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = team_members.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- 4. Crear Índices
CREATE INDEX idx_team_members_store_id ON public.team_members(store_id);
CREATE INDEX idx_team_members_role ON public.team_members(role);
