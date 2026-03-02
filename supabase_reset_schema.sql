-- 1. Nettoyage complet
-- Supprime les tables existantes (si elles existent)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.produits CASCADE; -- Ancienne version potentielle
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Création des tables

-- Table des UTILISATEURS / PERSONNEL
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Administrateur', 'Serveur', 'Cuisine', 'Caissier')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table des CATÉGORIES
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#2563eb',
    icon TEXT DEFAULT '🍽️',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table des PRODUITS
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table des COMMANDES
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number TEXT NOT NULL,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'En attente',
    total NUMERIC NOT NULL DEFAULT 0,
    user_id UUID REFERENCES public.users(id),
    items JSONB, -- Stockage flexible des articles si besoin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table optionnelle pour le détail des lignes de commande
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    unit_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table des RÉGLAGES (PIN, etc.)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Activer RLS (Row Level Security) - Optionnel mais recommandé
-- Pour simplifier le début, on peut désactiver ou autoriser l'accès public
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Créer des politiques d'accès simples (Tout le monde peut lire/écrire pour le moment)
CREATE POLICY "Allow all access" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.settings FOR ALL USING (true);

-- 4. Insertion d'un Admin par défaut (Optionnel car le code gère le fallback)
INSERT INTO public.users (name, email, role) 
VALUES ('Administrateur', 'admin@cmdesk.com', 'Administrateur');
