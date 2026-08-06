-- Habilitar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. TABLA: profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'owner'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. TABLA: stores
-- ==========================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TABLA: settings
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
    parameters JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ÍNDICES (Para mejorar el rendimiento)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_store_id ON public.settings(store_id);

-- ==========================================
-- FUNCIONES Y TRIGGERS
-- ==========================================

-- Trigger para actualizar `updated_at` en la tabla `settings`
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_settings_updated
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para crear perfil automáticamente al registrarse un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        'owner'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger para crear configuraciones automáticamente al crear un comercio
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.settings (store_id, parameters)
    VALUES (NEW.id, '{}'::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_store_created
    AFTER INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_store();


-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas para `profiles`
-- Solo el usuario autenticado puede ver y actualizar su propio perfil
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Políticas para `stores`
-- Un usuario solo puede ver, insertar, actualizar o eliminar sus propios comercios
CREATE POLICY "Users can view own stores" 
    ON public.stores FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own stores" 
    ON public.stores FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own stores" 
    ON public.stores FOR UPDATE 
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own stores" 
    ON public.stores FOR DELETE 
    USING (auth.uid() = owner_id);

-- Políticas para `settings`
-- Un usuario solo puede acceder a las configuraciones de un comercio si le pertenece
CREATE POLICY "Users can view settings of own stores" 
    ON public.settings FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = settings.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update settings of own stores" 
    ON public.settings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = settings.store_id 
            AND stores.owner_id = auth.uid()
        )
    );
