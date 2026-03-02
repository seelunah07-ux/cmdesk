-- SCRIPT POUR LE STOCKAGE DES IMAGES (SUPABASE STORAGE)
-- À exécuter dans le SQL Editor de Supabase

-- 1. Création du bucket 'product-images' (si pas encore fait via l'UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;

-- 3. Création des politiques d'accès pour le bucket 'product-images'

-- Autoriser la lecture publique (tout le monde peut voir les images)
CREATE POLICY "Allow Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Autoriser l'upload (tout le monde peut ajouter des images)
CREATE POLICY "Allow Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' );

-- Autoriser la modification (tout le monde peut mettre à jour ses images)
CREATE POLICY "Allow Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' );

-- Autoriser la suppression
CREATE POLICY "Allow Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' );
